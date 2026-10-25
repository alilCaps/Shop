const db = require("../config/db");

const pdb = db.promise();

const PAYMENT_METHODS = [
    "CASH_ON_DELIVERY",
    "GCASH",
    "MAYA",
    "BANK_TRANSFER",
    "CREDIT_CARD",
    "DEBIT_CARD"
];

const DEFAULT_SETTINGS = {
    shipping_fee: 50,
    free_shipping_minimum: 1000
};

function validId(value) {
    return /^\d+$/.test(String(value)) && Number(value) > 0;
}

function generateOrderNumber() {
    const d = new Date();
    const stamp =
        `${d.getFullYear()}` +
        `${String(d.getMonth() + 1).padStart(2, "0")}` +
        `${String(d.getDate()).padStart(2, "0")}`;
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();

    return `SP${stamp}${random}`;
}

// Wraps an async route handler so errors become a clean 500 response.
function handler(fn) {
    return async (req, res) => {
        try {
            await fn(req, res);
        } catch (error) {
            console.error(`${fn.name || "HANDLER"} ERROR:`, error);

            if (!res.headersSent) {
                res.status(500).json({
                    message: "Something went wrong. Please try again."
                });
            }
        }
    };
}

// For /:userId routes: the caller must be that user and the account active.
async function requireUser(req, res, next) {
    const { userId } = req.params;

    if (!validId(userId)) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    if (!req.auth || req.auth.uid !== Number(userId)) {
        return res.status(403).json({
            message: "You do not have permission to access this account."
        });
    }

    try {
        const [rows] = await pdb.query(
            "SELECT status FROM users WHERE user_id = ?",
            [Number(userId)]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        if (rows[0].status !== "ACTIVE") {
            return res.status(403).json({ message: "Account is not active." });
        }

        req.userId = Number(userId);
        return next();
    } catch (error) {
        console.error("REQUIRE USER ERROR:", error);
        return res.status(500).json({ message: "Unable to verify account." });
    }
}

async function getShippingSettings(conn = pdb) {
    const settings = { ...DEFAULT_SETTINGS };

    try {
        const [rows] = await conn.query(
            `SELECT setting_name, setting_value
             FROM app_settings
             WHERE setting_name IN ('shipping_fee', 'free_shipping_minimum')`
        );

        for (const row of rows) {
            const value = Number(row.setting_value);

            if (Number.isFinite(value) && value >= 0) {
                settings[row.setting_name] = value;
            }
        }
    } catch {
        // app_settings may not exist yet (migration not run): use defaults.
    }

    return settings;
}

function calculateShipping(subtotal, settings) {
    return subtotal >= settings.free_shipping_minimum
        ? 0
        : settings.shipping_fee;
}

async function notify(
    conn,
    userId,
    title,
    message,
    type = "ORDER",
    referenceId = null
) {
    try {
        await (conn || pdb).query(
            `INSERT INTO notifications
                (user_id, title, message, notification_type, reference_id)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, title, message, type, referenceId]
        );
    } catch (error) {
        console.error("NOTIFY ERROR:", error.message);
    }
}

// Put the quantities of an order back into inventory.
async function restoreStock(conn, orderId) {
    await conn.query(
        `UPDATE inventory i
         INNER JOIN order_items oi ON oi.variant_id = i.variant_id
         SET i.quantity = i.quantity + oi.quantity
         WHERE oi.order_id = ?`,
        [orderId]
    );
}

// When an order is cancelled: paid money is refunded, unpaid is voided.
async function closePaymentOnCancel(conn, orderId) {
    await conn.query(
        `UPDATE payments
         SET status = CASE
             WHEN status = 'PAID' THEN 'REFUNDED'
             ELSE 'FAILED'
         END
         WHERE order_id = ? AND status <> 'REFUNDED'`,
        [orderId]
    );
}

// Allowed order status changes (shared by admin and seller).
const ORDER_TRANSITIONS = {
    PENDING_PAYMENT: ["PAID", "CANCELLED"],
    PAID: ["PROCESSING", "CANCELLED", "REFUNDED"],
    PROCESSING: ["SHIPPED", "CANCELLED", "REFUNDED"],
    SHIPPED: ["DELIVERED", "REFUNDED"],
    DELIVERED: ["COMPLETED", "REFUNDED"],
    COMPLETED: ["REFUNDED"],
    CANCELLED: [],
    REFUNDED: []
};

module.exports = {
    pdb,
    PAYMENT_METHODS,
    ORDER_TRANSITIONS,
    validId,
    generateOrderNumber,
    handler,
    requireUser,
    getShippingSettings,
    calculateShipping,
    notify,
    restoreStock,
    closePaymentOnCancel
};
