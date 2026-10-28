const { notify } = require("./helpers");

// The one place that defines the return window.
const RETURN_WINDOW_DAYS = 3;
const RETURN_WINDOW_SECONDS = RETURN_WINDOW_DAYS * 24 * 60 * 60;

// Orders in these states can be returned (while the window is open).
const RETURNABLE_ORDER_STATUSES = ["DELIVERED", "COMPLETED"];

// A request that is rejected or cancelled no longer blocks a new one.
const INACTIVE_RETURN_STATUSES = ["REJECTED", "CANCELLED"];

// secondsSinceDelivery comes from SQL (TIMESTAMPDIFF against NOW()), so the
// rule does not depend on server / database time zones.
function returnWindow(secondsSinceDelivery) {
    const since = Number(secondsSinceDelivery);

    if (!Number.isFinite(since)) {
        return { open: false, deadline: null, secondsLeft: 0 };
    }

    const secondsLeft = Math.max(0, RETURN_WINDOW_SECONDS - Math.max(0, since));

    return {
        open: secondsLeft > 0,
        secondsLeft,
        deadline: new Date(Date.now() + secondsLeft * 1000).toISOString()
    };
}

// Who may move a return to which status.
//   customer: cancel (REQUESTED / APPROVED), ship back (APPROVED, RETURN type)
//   seller:   approve / reject, mark received, complete the refund
//   admin:    everything a seller can, plus cancel
function allowedTargets(ret, actor) {
    const refundOnly = ret.return_type === "REFUND";
    const targets = [];

    switch (ret.status) {
        case "REQUESTED":
            if (actor === "CUSTOMER") targets.push("CANCELLED");
            else targets.push("APPROVED", "REJECTED");
            if (actor === "ADMIN") targets.push("CANCELLED");
            break;
        case "APPROVED":
            if (actor === "CUSTOMER") {
                if (!refundOnly) targets.push("ITEM_SHIPPED");
                targets.push("CANCELLED");
            } else {
                if (refundOnly) targets.push("COMPLETED");
                if (actor === "ADMIN") targets.push("CANCELLED");
            }
            break;
        case "ITEM_SHIPPED":
            if (actor !== "CUSTOMER") targets.push("RECEIVED");
            break;
        case "RECEIVED":
            if (actor !== "CUSTOMER") targets.push("COMPLETED");
            break;
        default:
            break;
    }

    return targets;
}

const CUSTOMER_MESSAGES = {
    APPROVED: "was approved. {next}",
    REJECTED: "was rejected by the seller.",
    ITEM_SHIPPED: "is marked as shipped back to the seller.",
    RECEIVED: "was received by the seller. Your refund is being processed.",
    COMPLETED: "is complete and your refund was issued.",
    CANCELLED: "was cancelled."
};

async function shopOwners(conn, orderId) {
    const [rows] = await conn.query(
        `SELECT DISTINCT s.owner_id
         FROM order_items oi
         INNER JOIN shops s ON s.shop_id = oi.shop_id
         WHERE oi.order_id = ?`,
        [orderId]
    );

    return rows.map((row) => row.owner_id);
}

// Moves a return to `newStatus` and runs the side effects. Must be called
// inside a transaction; `ret` must be the row locked with FOR UPDATE.
// Returns { error } (409 style message) or { ok: true }.
async function applyReturnStatus(conn, ret, newStatus, actor) {
    if (!allowedTargets(ret, actor).includes(newStatus)) {
        return {
            error: `A ${String(ret.return_type).toLowerCase()} request that is ${String(
                ret.status
            )
                .toLowerCase()
                .replace(/_/g, " ")} cannot be changed to ${newStatus
                .toLowerCase()
                .replace(/_/g, " ")} by ${actor.toLowerCase()}.`
        };
    }

    const [orders] = await conn.query(
        "SELECT order_number FROM orders WHERE order_id = ?",
        [ret.order_id]
    );
    const orderNumber = orders[0]?.order_number || `#${ret.order_id}`;

    await conn.query("UPDATE returns SET status = ? WHERE return_id = ?", [
        newStatus,
        ret.return_id
    ]);

    if (newStatus === "COMPLETED") {
        const [items] = await conn.query(
            `SELECT ri.quantity, oi.unit_price, oi.variant_id
             FROM return_items ri
             INNER JOIN order_items oi ON oi.order_item_id = ri.order_item_id
             WHERE ri.return_id = ?`,
            [ret.return_id]
        );

        const amount = items.reduce(
            (sum, item) => sum + Number(item.unit_price) * item.quantity,
            0
        );

        const [payments] = await conn.query(
            "SELECT payment_id, payment_method, status FROM payments WHERE order_id = ? FOR UPDATE",
            [ret.order_id]
        );

        if (payments.length === 0) {
            throw new Error("Order has no payment record to refund.");
        }

        const payment = payments[0];
        const reference = `RF-${ret.return_id}-${Date.now().toString(36).toUpperCase()}`;

        await conn.query(
            `INSERT INTO refunds
                (return_id, payment_id, refund_amount, refund_method,
                 transaction_reference, status, refunded_at)
             VALUES (?, ?, ?, ?, ?, 'COMPLETED', NOW())
             ON DUPLICATE KEY UPDATE
                refund_amount = VALUES(refund_amount),
                status = 'COMPLETED',
                refunded_at = NOW()`,
            [ret.return_id, payment.payment_id, amount, payment.payment_method, reference]
        );

        // The goods come back on the shelf only when they were really returned.
        if (ret.return_type === "RETURN") {
            for (const item of items) {
                if (item.variant_id) {
                    await conn.query(
                        "UPDATE inventory SET quantity = quantity + ? WHERE variant_id = ?",
                        [item.quantity, item.variant_id]
                    );
                }
            }
        }

        await conn.query(
            "UPDATE returns SET completed_at = NOW() WHERE return_id = ?",
            [ret.return_id]
        );

        // Whole order returned? Then the order and its payment are refunded.
        const [[ordered]] = await conn.query(
            "SELECT COALESCE(SUM(quantity), 0) AS total FROM order_items WHERE order_id = ?",
            [ret.order_id]
        );
        const [[returned]] = await conn.query(
            `SELECT COALESCE(SUM(ri.quantity), 0) AS total
             FROM return_items ri
             INNER JOIN returns r ON r.return_id = ri.return_id
             WHERE r.order_id = ? AND r.status = 'COMPLETED'`,
            [ret.order_id]
        );

        if (Number(returned.total) >= Number(ordered.total)) {
            await conn.query("UPDATE orders SET status = 'REFUNDED' WHERE order_id = ?", [
                ret.order_id
            ]);

            if (payment.status === "PAID") {
                await conn.query(
                    "UPDATE payments SET status = 'REFUNDED' WHERE payment_id = ?",
                    [payment.payment_id]
                );
            }
        }
    }

    const verb = (CUSTOMER_MESSAGES[newStatus] || "was updated.").replace(
        "{next}",
        ret.return_type === "RETURN"
            ? "Please ship the item back, then mark it as shipped."
            : "Your refund is being processed."
    );

    await notify(
        conn,
        ret.user_id,
        "Return update",
        `Your ${ret.return_type === "RETURN" ? "return" : "refund"} request for order ${orderNumber} ${verb}`,
        "ORDER",
        ret.order_id
    );

    // Tell the shop when the customer is the one who acted.
    if (actor === "CUSTOMER") {
        for (const ownerId of await shopOwners(conn, ret.order_id)) {
            await notify(
                conn,
                ownerId,
                "Return update",
                `The customer ${
                    newStatus === "CANCELLED"
                        ? "cancelled the return request"
                        : "shipped the returned item back"
                } for order ${orderNumber}.`,
                "ORDER",
                ret.order_id
            );
        }
    }

    return { ok: true };
}

// Adds `return_info` to each order: whether a return can still be requested,
// when the window closes, and the latest request (if any).
async function attachReturnInfo(conn, orders) {
    if (orders.length === 0) return orders;

    const ids = orders.map((order) => order.order_id);

    const [ages] = await conn.query(
        `SELECT o.order_id,
                TIMESTAMPDIFF(SECOND, COALESCE(sh.delivered_at, o.updated_at), NOW()) AS seconds_since
         FROM orders o
         LEFT JOIN shipments sh ON sh.order_id = o.order_id
         WHERE o.order_id IN (?)`,
        [ids]
    );

    const [returns] = await conn.query(
        `SELECT return_id, order_id, status, return_type
         FROM returns
         WHERE order_id IN (?)
         ORDER BY return_id DESC`,
        [ids]
    );

    return orders.map((order) => {
        const age = ages.find((row) => row.order_id === order.order_id);
        const window = returnWindow(age?.seconds_since);
        const latest = returns.find((row) => row.order_id === order.order_id) || null;
        const active = returns.find(
            (row) =>
                row.order_id === order.order_id &&
                !INACTIVE_RETURN_STATUSES.includes(row.status)
        );
        const eligibleStatus = RETURNABLE_ORDER_STATUSES.includes(order.status);

        return {
            ...order,
            return_info: {
                window_days: RETURN_WINDOW_DAYS,
                can_return: eligibleStatus && window.open && !active,
                window_open: eligibleStatus && window.open,
                deadline: eligibleStatus ? window.deadline : null,
                seconds_left: eligibleStatus ? window.secondsLeft : 0,
                latest_return: latest
            }
        };
    });
}

module.exports = {
    attachReturnInfo,
    RETURN_WINDOW_DAYS,
    RETURNABLE_ORDER_STATUSES,
    INACTIVE_RETURN_STATUSES,
    returnWindow,
    allowedTargets,
    applyReturnStatus,
    shopOwners
};
