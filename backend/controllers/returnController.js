const { pdb, validId, handler, notify } = require("../utils/helpers");
const {
    RETURN_WINDOW_DAYS,
    RETURNABLE_ORDER_STATUSES,
    INACTIVE_RETURN_STATUSES,
    returnWindow,
    allowedTargets,
    applyReturnStatus
} = require("../utils/returns");

const ADMIN_STATUSES = [
    "APPROVED",
    "REJECTED",
    "ITEM_SHIPPED",
    "RECEIVED",
    "COMPLETED",
    "CANCELLED"
];

// Loads returns (with items, order, shop and refund info) matching `where`.
async function fetchReturns(conn, where, params, actor) {
    const [rows] = await conn.query(
        `SELECT
            r.return_id, r.order_id, r.user_id, r.reason, r.return_type, r.status,
            r.requested_at, r.completed_at,
            o.order_number,
            CONCAT_WS(' ', u.first_name, u.last_name) AS customer_name,
            (SELECT s.shop_name
             FROM order_items oi INNER JOIN shops s ON s.shop_id = oi.shop_id
             WHERE oi.order_id = r.order_id LIMIT 1) AS shop_name,
            rf.refund_amount, rf.status AS refund_status, rf.refunded_at
         FROM returns r
         INNER JOIN orders o ON o.order_id = r.order_id
         INNER JOIN users u ON u.user_id = r.user_id
         LEFT JOIN refunds rf ON rf.return_id = r.return_id
         WHERE ${where}
         ORDER BY r.return_id DESC`,
        params
    );

    if (rows.length === 0) return [];

    const [items] = await conn.query(
        `SELECT ri.return_id, ri.order_item_id, ri.quantity, ri.reason,
                oi.product_id, oi.product_name, oi.variant_name, oi.unit_price
         FROM return_items ri
         INNER JOIN order_items oi ON oi.order_item_id = ri.order_item_id
         WHERE ri.return_id IN (?)`,
        [rows.map((row) => row.return_id)]
    );

    return rows.map((row) => {
        const own = items.filter((item) => item.return_id === row.return_id);

        return {
            ...row,
            items: own,
            expected_refund: own.reduce(
                (sum, item) => sum + Number(item.unit_price) * item.quantity,
                0
            ),
            actions: allowedTargets(row, actor)
        };
    });
}

// ------------------------------------------------------------------
// Customer
// ------------------------------------------------------------------
exports.createReturn = handler(async function createReturn(req, res) {
    const { orderId } = req.params;
    const type = String(req.body.return_type || "").toUpperCase();
    const reason =
        typeof req.body.reason === "string" ? req.body.reason.trim().slice(0, 1000) : "";
    const requested = Array.isArray(req.body.items) ? req.body.items : [];

    if (!validId(orderId)) {
        return res.status(400).json({ message: "Invalid order." });
    }

    if (!["RETURN", "REFUND"].includes(type)) {
        return res.status(400).json({ message: "Choose return or refund." });
    }

    if (!reason) {
        return res.status(400).json({ message: "Please tell us why you want to return this." });
    }

    if (requested.length === 0) {
        return res.status(400).json({ message: "Choose at least one item." });
    }

    const conn = await pdb.getConnection();

    try {
        await conn.beginTransaction();

        const [orders] = await conn.query(
            `SELECT o.order_id, o.order_number, o.status,
                    TIMESTAMPDIFF(SECOND, COALESCE(sh.delivered_at, o.updated_at), NOW()) AS seconds_since
             FROM orders o
             LEFT JOIN shipments sh ON sh.order_id = o.order_id
             WHERE o.order_id = ? AND o.user_id = ?
             FOR UPDATE`,
            [Number(orderId), req.userId]
        );

        const order = orders[0];

        if (!order) {
            await conn.rollback();
            return res.status(404).json({ message: "Order not found." });
        }

        if (!RETURNABLE_ORDER_STATUSES.includes(order.status)) {
            await conn.rollback();
            return res.status(409).json({
                message: "Only delivered orders can be returned."
            });
        }

        if (!returnWindow(order.seconds_since).open) {
            await conn.rollback();
            return res.status(409).json({
                message: `The ${RETURN_WINDOW_DAYS}-day return window for this order has closed.`
            });
        }

        const [existing] = await conn.query(
            "SELECT status FROM returns WHERE order_id = ?",
            [order.order_id]
        );

        if (existing.some((row) => !INACTIVE_RETURN_STATUSES.includes(row.status))) {
            await conn.rollback();
            return res.status(409).json({
                message: "You already have a return request for this order."
            });
        }

        const [orderItems] = await conn.query(
            "SELECT order_item_id, quantity FROM order_items WHERE order_id = ?",
            [order.order_id]
        );

        const chosen = [];

        for (const entry of requested) {
            const itemId = Number(entry.order_item_id);
            const quantity = Number(entry.quantity);
            const match = orderItems.find((item) => item.order_item_id === itemId);

            if (!match) {
                await conn.rollback();
                return res.status(400).json({ message: "One of the items is not part of this order." });
            }

            if (!Number.isInteger(quantity) || quantity < 1 || quantity > match.quantity) {
                await conn.rollback();
                return res.status(400).json({
                    message: "Choose a valid quantity for each item."
                });
            }

            if (chosen.some((item) => item.order_item_id === itemId)) {
                await conn.rollback();
                return res.status(400).json({ message: "An item was listed twice." });
            }

            chosen.push({
                order_item_id: itemId,
                quantity,
                reason:
                    typeof entry.reason === "string"
                        ? entry.reason.trim().slice(0, 1000) || null
                        : null
            });
        }

        const [created] = await conn.query(
            "INSERT INTO returns (order_id, user_id, reason, return_type) VALUES (?, ?, ?, ?)",
            [order.order_id, req.userId, reason, type]
        );

        for (const item of chosen) {
            await conn.query(
                `INSERT INTO return_items (return_id, order_item_id, quantity, reason)
                 VALUES (?, ?, ?, ?)`,
                [created.insertId, item.order_item_id, item.quantity, item.reason]
            );
        }

        await notify(
            conn,
            req.userId,
            "Return requested",
            `Your ${type === "RETURN" ? "return" : "refund"} request for order ${order.order_number} was sent to the seller.`,
            "ORDER",
            order.order_id
        );

        const [owners] = await conn.query(
            `SELECT DISTINCT s.owner_id
             FROM order_items oi INNER JOIN shops s ON s.shop_id = oi.shop_id
             WHERE oi.order_id = ?`,
            [order.order_id]
        );

        for (const owner of owners) {
            await notify(
                conn,
                owner.owner_id,
                "New return request",
                `A customer asked to ${type === "RETURN" ? "return items from" : "get a refund for"} order ${order.order_number}.`,
                "ORDER",
                order.order_id
            );
        }

        await conn.commit();

        res.status(201).json({
            message: "Your request was sent. The seller will review it.",
            return_id: created.insertId
        });
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
});

exports.listCustomerReturns = handler(async function listCustomerReturns(req, res) {
    res.json({
        returns: await fetchReturns(pdb, "r.user_id = ?", [req.userId], "CUSTOMER"),
        window_days: RETURN_WINDOW_DAYS
    });
});

// Runs a status change inside a transaction with the return row locked.
async function changeStatus(req, res, { where, params, status, actor }) {
    const conn = await pdb.getConnection();

    try {
        await conn.beginTransaction();

        const [rows] = await conn.query(
            `SELECT r.* FROM returns r WHERE ${where} FOR UPDATE`,
            params
        );

        if (rows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: "Return request not found." });
        }

        const result = await applyReturnStatus(conn, rows[0], status, actor);

        if (result.error) {
            await conn.rollback();
            return res.status(409).json({ message: result.error });
        }

        await conn.commit();
        return res.json({ message: "Return request updated." });
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

exports.cancelReturn = handler(async function cancelReturn(req, res) {
    if (!validId(req.params.returnId)) {
        return res.status(400).json({ message: "Invalid return." });
    }

    return changeStatus(req, res, {
        where: "r.return_id = ? AND r.user_id = ?",
        params: [Number(req.params.returnId), req.userId],
        status: "CANCELLED",
        actor: "CUSTOMER"
    });
});

exports.shipBackReturn = handler(async function shipBackReturn(req, res) {
    if (!validId(req.params.returnId)) {
        return res.status(400).json({ message: "Invalid return." });
    }

    return changeStatus(req, res, {
        where: "r.return_id = ? AND r.user_id = ?",
        params: [Number(req.params.returnId), req.userId],
        status: "ITEM_SHIPPED",
        actor: "CUSTOMER"
    });
});

// ------------------------------------------------------------------
// Seller (req.shop is loaded by requireSeller)
// ------------------------------------------------------------------
const SHOP_FILTER = `EXISTS (
    SELECT 1 FROM order_items oi
    WHERE oi.order_id = r.order_id AND oi.shop_id = ?
)`;

exports.listShopReturns = handler(async function listShopReturns(req, res) {
    if (!req.shop) return res.json({ returns: [] });

    res.json({
        returns: await fetchReturns(pdb, SHOP_FILTER, [req.shop.shop_id], "SELLER")
    });
});

exports.updateShopReturn = handler(async function updateShopReturn(req, res) {
    if (!req.shop) {
        return res.status(409).json({ message: "Create your shop first." });
    }

    const status = String(req.body.status || "").toUpperCase();

    if (!validId(req.params.returnId) || !ADMIN_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid request." });
    }

    return changeStatus(req, res, {
        where: `r.return_id = ? AND ${SHOP_FILTER}`,
        params: [Number(req.params.returnId), req.shop.shop_id],
        status,
        actor: "SELLER"
    });
});

// ------------------------------------------------------------------
// Admin
// ------------------------------------------------------------------
exports.listAdminReturns = handler(async function listAdminReturns(req, res) {
    const rows = await fetchReturns(pdb, "1 = 1", [], "ADMIN");

    res.json({
        data: rows.map((row) => ({
            return_id: row.return_id,
            order_number: row.order_number,
            customer_name: row.customer_name,
            shop_name: row.shop_name,
            return_type: row.return_type,
            reason: row.reason,
            status: row.status,
            refund_amount: row.refund_amount ?? row.expected_refund,
            requested_at: row.requested_at,
            completed_at: row.completed_at,
            allowed_statuses: row.actions
        }))
    });
});

exports.updateAdminReturn = handler(async function updateAdminReturn(req, res) {
    const status = String(req.body.status || "").toUpperCase();

    if (!validId(req.params.returnId) || !ADMIN_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid request." });
    }

    return changeStatus(req, res, {
        where: "r.return_id = ?",
        params: [Number(req.params.returnId)],
        status,
        actor: "ADMIN"
    });
});
