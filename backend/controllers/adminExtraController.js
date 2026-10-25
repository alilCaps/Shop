const {
    pdb,
    ORDER_TRANSITIONS,
    validId,
    handler,
    notify,
    restoreStock,
    closePaymentOnCancel
} = require("../utils/helpers");

// PUT /api/admin/orders/:orderId
// Same rules as before, but also keeps stock, payments and shipments in sync.
exports.updateOrder = handler(async function updateOrder(req, res) {
    const { orderId } = req.params;
    const status = String(req.body.status || "").trim().toUpperCase();

    if (!validId(orderId)) {
        return res.status(400).json({ message: "Invalid order ID." });
    }

    if (!Object.keys(ORDER_TRANSITIONS).includes(status)) {
        return res.status(400).json({
            message: `Status must be one of: ${Object.keys(ORDER_TRANSITIONS).join(", ")}.`
        });
    }

    const conn = await pdb.getConnection();

    try {
        await conn.beginTransaction();

        const [rows] = await conn.query(
            "SELECT order_id, order_number, user_id, status FROM orders WHERE order_id = ? FOR UPDATE",
            [Number(orderId)]
        );

        if (rows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: "Order not found." });
        }

        const order = rows[0];

        if (order.status === status) {
            await conn.rollback();
            return res.json({ message: "Order status updated successfully." });
        }

        if (!ORDER_TRANSITIONS[order.status].includes(status)) {
            await conn.rollback();
            return res.status(409).json({
                message: `Order cannot move from ${order.status} to ${status}.`
            });
        }

        await conn.query("UPDATE orders SET status = ? WHERE order_id = ?", [
            status,
            order.order_id
        ]);

        if (status === "PAID") {
            await conn.query(
                `UPDATE payments
                 SET status = 'PAID', paid_at = COALESCE(paid_at, NOW())
                 WHERE order_id = ?`,
                [order.order_id]
            );
        }

        if (status === "SHIPPED") {
            await conn.query(
                `INSERT INTO shipments (order_id, status, shipped_at)
                 VALUES (?, 'IN_TRANSIT', NOW())
                 ON DUPLICATE KEY UPDATE status = 'IN_TRANSIT', shipped_at = COALESCE(shipped_at, NOW())`,
                [order.order_id]
            );
        }

        if (status === "DELIVERED") {
            await conn.query(
                `UPDATE shipments SET status = 'DELIVERED', delivered_at = NOW()
                 WHERE order_id = ?`,
                [order.order_id]
            );
        }

        if (status === "CANCELLED") {
            await restoreStock(conn, order.order_id);
            await closePaymentOnCancel(conn, order.order_id);
        }

        if (status === "REFUNDED") {
            await conn.query(
                "UPDATE payments SET status = 'REFUNDED' WHERE order_id = ? AND status = 'PAID'",
                [order.order_id]
            );
        }

        await notify(
            conn,
            order.user_id,
            "Order update",
            `Your order ${order.order_number} is now ${status.replace("_", " ").toLowerCase()}.`,
            "ORDER",
            order.order_id
        );

        await conn.commit();
        res.json({ message: "Order status updated successfully." });
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
});

// --------------------------------------------------
// SETTINGS
// --------------------------------------------------
exports.getSettings = handler(async function getSettings(req, res) {
    const [rows] = await pdb.query(
        `SELECT setting_id, setting_name, setting_value, updated_at
         FROM app_settings
         ORDER BY setting_name`
    );

    res.json({ data: rows });
});

const NUMERIC_SETTINGS = ["shipping_fee", "free_shipping_minimum"];

exports.updateSetting = handler(async function updateSetting(req, res) {
    const { settingId } = req.params;
    const value =
        typeof req.body.setting_value === "string" ||
        typeof req.body.setting_value === "number"
            ? String(req.body.setting_value).trim()
            : "";

    if (!validId(settingId)) {
        return res.status(400).json({ message: "Invalid setting ID." });
    }

    if (!value || value.length > 500) {
        return res.status(400).json({
            message: "Setting value is required (max 500 characters)."
        });
    }

    const [rows] = await pdb.query(
        "SELECT setting_name FROM app_settings WHERE setting_id = ?",
        [Number(settingId)]
    );

    if (rows.length === 0) {
        return res.status(404).json({ message: "Setting not found." });
    }

    if (
        NUMERIC_SETTINGS.includes(rows[0].setting_name) &&
        (!Number.isFinite(Number(value)) || Number(value) < 0)
    ) {
        return res.status(400).json({
            message: "This setting must be a non-negative number."
        });
    }

    await pdb.query(
        "UPDATE app_settings SET setting_value = ? WHERE setting_id = ?",
        [value, Number(settingId)]
    );

    res.json({ message: "Setting updated successfully." });
});
