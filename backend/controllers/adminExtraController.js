const bcrypt = require("bcrypt");

const {
    cleanImagePath,
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

// --------------------------------------------------
// ADMIN PROFILE
// --------------------------------------------------
async function recordAudit(req, action, recordId, oldValue, newValue) {
    try {
        await pdb.query(
            `INSERT INTO audit_logs
                (user_id, action, table_name, record_id, old_value, new_value, ip_address)
             VALUES (?, ?, 'users', ?, ?, ?, ?)`,
            [
                req.auth.uid,
                action,
                recordId,
                oldValue ? JSON.stringify(oldValue) : null,
                newValue ? JSON.stringify(newValue) : null,
                String(req.ip || "").slice(0, 45) || null
            ]
        );
    } catch (error) {
        console.warn("AUDIT LOG skipped:", error.code || error.message);
    }
}

async function loadProfile(userId) {
    const [rows] = await pdb.query(
        `SELECT u.user_id, u.username, u.email, u.first_name, u.last_name,
                CONCAT_WS(' ', u.first_name, u.last_name) AS full_name,
                u.phone, u.profile_image, u.status, u.last_login_at,
                u.created_at, r.role_name
         FROM users u
         LEFT JOIN roles r ON r.role_id = u.role_id
         WHERE u.user_id = ?`,
        [userId]
    );

    if (rows.length === 0) return null;

    let activity = 0;

    try {
        const [counts] = await pdb.query(
            "SELECT COUNT(*) AS total FROM audit_logs WHERE user_id = ?",
            [userId]
        );
        activity = Number(counts[0].total);
    } catch {
        activity = 0;
    }

    return { ...rows[0], activity_count: activity };
}

// GET /api/admin/profile
exports.getProfile = handler(async function getProfile(req, res) {
    const profile = await loadProfile(req.auth.uid);

    if (!profile) {
        return res.status(404).json({ message: "Account not found." });
    }

    res.json({ data: profile });
});

// PUT /api/admin/profile
exports.updateProfile = handler(async function updateProfile(req, res) {
    const body = req.body || {};
    const updates = {};

    for (const field of ["first_name", "last_name"]) {
        const value = typeof body[field] === "string" ? body[field].trim() : "";

        if (!value || value.length > 100) {
            return res.status(400).json({
                message: `${field === "first_name" ? "First" : "Last"} name is required (max 100 characters).`
            });
        }

        updates[field] = value;
    }

    if (body.phone !== undefined) {
        if (body.phone !== null && typeof body.phone !== "string") {
            return res.status(400).json({ message: "Phone must be text." });
        }

        const phone = (body.phone || "").trim();

        if (phone.length > 30) {
            return res.status(400).json({
                message: "Phone number must not exceed 30 characters."
            });
        }

        updates.phone = phone || null;
    }

    if (body.profile_image !== undefined) {
        if (body.profile_image === "" || body.profile_image === null) {
            updates.profile_image = null;
        } else {
            const image = cleanImagePath(body.profile_image);

            if (!image) {
                return res.status(400).json({ message: "Invalid profile image." });
            }

            updates.profile_image = image;
        }
    }

    const before = await loadProfile(req.auth.uid);

    if (!before) {
        return res.status(404).json({ message: "Account not found." });
    }

    const keys = Object.keys(updates);

    await pdb.query(
        `UPDATE users SET ${keys.map((key) => `${key} = ?`).join(", ")} WHERE user_id = ?`,
        [...keys.map((key) => updates[key]), req.auth.uid]
    );

    await recordAudit(
        req,
        "PROFILE_UPDATED",
        req.auth.uid,
        Object.fromEntries(keys.map((key) => [key, before[key]])),
        updates
    );

    res.json({
        message: "Profile updated successfully.",
        data: await loadProfile(req.auth.uid)
    });
});

// PUT /api/admin/profile/password
exports.changePassword = handler(async function changePassword(req, res) {
    const current =
        typeof req.body?.current_password === "string" ? req.body.current_password : "";
    const next =
        typeof req.body?.new_password === "string" ? req.body.new_password : "";

    if (!current) {
        return res.status(400).json({ message: "Enter your current password." });
    }

    // bcrypt only uses the first 72 bytes of a password.
    if (next.length < 8 || Buffer.byteLength(next) > 72) {
        return res.status(400).json({
            message: "The new password must be 8 to 72 characters long."
        });
    }

    if (next === current) {
        return res.status(400).json({
            message: "The new password must be different from the current one."
        });
    }

    const [rows] = await pdb.query(
        "SELECT password_hash FROM users WHERE user_id = ?",
        [req.auth.uid]
    );

    if (rows.length === 0) {
        return res.status(404).json({ message: "Account not found." });
    }

    const matches = await bcrypt.compare(current, rows[0].password_hash);

    if (!matches) {
        return res.status(400).json({ message: "Your current password is incorrect." });
    }

    await pdb.query("UPDATE users SET password_hash = ? WHERE user_id = ?", [
        await bcrypt.hash(next, 10),
        req.auth.uid
    ]);

    await recordAudit(req, "PASSWORD_CHANGED", req.auth.uid, null, null);

    res.json({ message: "Password changed successfully." });
});

// --------------------------------------------------
// REPORTS
// GET /api/admin/reports?from=YYYY-MM-DD&to=YYYY-MM-DD
// --------------------------------------------------
const REVENUE_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"];
const MAX_REPORT_DAYS = 366;

function pad(value) {
    return String(value).padStart(2, "0");
}

function formatDay(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// "2026-10-28" -> local Date at midnight, or null when invalid.
function parseDay(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));

    if (!match) return null;

    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));

    return formatDay(date) === value ? date : null;
}

exports.getReports = handler(async function getReports(req, res) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const to = req.query.to ? parseDay(req.query.to) : today;
    const defaultFrom = new Date(to || today);
    defaultFrom.setDate(defaultFrom.getDate() - 29);
    const from = req.query.from ? parseDay(req.query.from) : defaultFrom;

    if (!from || !to) {
        return res.status(400).json({ message: "Dates must use the YYYY-MM-DD format." });
    }

    if (from > to) {
        return res.status(400).json({ message: "The start date must not be after the end date." });
    }

    const days = Math.round((to - from) / 86400000) + 1;

    if (days > MAX_REPORT_DAYS) {
        return res.status(400).json({
            message: `Choose a range of ${MAX_REPORT_DAYS} days or fewer.`
        });
    }

    const end = new Date(to);
    end.setDate(end.getDate() + 1);

    const start = `${formatDay(from)} 00:00:00`;
    const stop = `${formatDay(end)} 00:00:00`;
    const inRange = [start, stop];

    const [
        [summaryRows],
        [newUsers],
        [newShops],
        [refundRows],
        [dailyRows],
        [statusRows],
        [productRows],
        [shopRows],
        [stockRows],
        [methodRows]
    ] = await Promise.all([
        pdb.query(
            `SELECT COUNT(*) AS orders, COALESCE(SUM(total_amount), 0) AS revenue
             FROM orders
             WHERE placed_at >= ? AND placed_at < ? AND status IN (?)`,
            [...inRange, REVENUE_STATUSES]
        ),
        pdb.query(
            "SELECT COUNT(*) AS total FROM users WHERE created_at >= ? AND created_at < ?",
            inRange
        ),
        pdb.query(
            "SELECT COUNT(*) AS total FROM shops WHERE created_at >= ? AND created_at < ?",
            inRange
        ),
        pdb.query(
            `SELECT COALESCE(SUM(refund_amount), 0) AS total
             FROM refunds
             WHERE status = 'COMPLETED'
               AND COALESCE(refunded_at, created_at) >= ?
               AND COALESCE(refunded_at, created_at) < ?`,
            inRange
        ),
        pdb.query(
            `SELECT DATE_FORMAT(placed_at, '%Y-%m-%d') AS day,
                    COUNT(*) AS orders,
                    COALESCE(SUM(total_amount), 0) AS revenue
             FROM orders
             WHERE placed_at >= ? AND placed_at < ? AND status IN (?)
             GROUP BY DATE_FORMAT(placed_at, '%Y-%m-%d')`,
            [...inRange, REVENUE_STATUSES]
        ),
        pdb.query(
            `SELECT status, COUNT(*) AS total
             FROM orders
             WHERE placed_at >= ? AND placed_at < ?
             GROUP BY status
             ORDER BY total DESC`,
            inRange
        ),
        pdb.query(
            `SELECT oi.product_id,
                    MAX(oi.product_name) AS name,
                    SUM(oi.quantity) AS units,
                    SUM(oi.subtotal) AS revenue
             FROM order_items oi
             INNER JOIN orders o ON o.order_id = oi.order_id
             WHERE o.placed_at >= ? AND o.placed_at < ? AND o.status IN (?)
             GROUP BY oi.product_id
             ORDER BY revenue DESC
             LIMIT 10`,
            [...inRange, REVENUE_STATUSES]
        ),
        pdb.query(
            `SELECT s.shop_id, s.shop_name,
                    SUM(oi.subtotal) AS revenue,
                    COUNT(DISTINCT o.order_id) AS orders
             FROM order_items oi
             INNER JOIN orders o ON o.order_id = oi.order_id
             INNER JOIN shops s ON s.shop_id = oi.shop_id
             WHERE o.placed_at >= ? AND o.placed_at < ? AND o.status IN (?)
             GROUP BY s.shop_id, s.shop_name
             ORDER BY revenue DESC
             LIMIT 10`,
            [...inRange, REVENUE_STATUSES]
        ),
        pdb.query(
            `SELECT p.product_id, p.product_name AS name,
                    GREATEST(COALESCE(SUM(i.quantity - i.reserved_quantity), 0), 0) AS stock
             FROM products p
             LEFT JOIN product_variants pv
                ON pv.product_id = p.product_id AND pv.status = 'ACTIVE'
             LEFT JOIN inventory i ON i.variant_id = pv.variant_id
             WHERE p.status IN ('ACTIVE', 'OUT_OF_STOCK')
             GROUP BY p.product_id, p.product_name
             HAVING stock <= 5
             ORDER BY stock ASC, p.product_id ASC
             LIMIT 10`
        ),
        pdb.query(
            `SELECT pay.payment_method AS method,
                    COUNT(*) AS total,
                    COALESCE(SUM(pay.amount), 0) AS amount
             FROM payments pay
             INNER JOIN orders o ON o.order_id = pay.order_id
             WHERE o.placed_at >= ? AND o.placed_at < ? AND o.status IN (?)
             GROUP BY pay.payment_method
             ORDER BY amount DESC`,
            [...inRange, REVENUE_STATUSES]
        )
    ]);

    // One row per day (even quiet days) so charts have no gaps.
    const byDay = new Map(dailyRows.map((row) => [row.day, row]));
    const salesByDay = [];

    for (let i = 0; i < days; i += 1) {
        const day = new Date(from);
        day.setDate(day.getDate() + i);
        const key = formatDay(day);
        const row = byDay.get(key);

        salesByDay.push({
            date: key,
            orders: row ? Number(row.orders) : 0,
            revenue: row ? Number(row.revenue) : 0
        });
    }

    const orders = Number(summaryRows.orders);
    const revenue = Number(summaryRows.revenue);

    res.json({
        data: {
            range: { from: formatDay(from), to: formatDay(to), days },
            summary: {
                revenue,
                orders,
                average_order_value: orders > 0 ? revenue / orders : 0,
                new_users: Number(newUsers[0].total),
                new_shops: Number(newShops[0].total),
                refunds_total: Number(refundRows[0].total)
            },
            sales_by_day: salesByDay,
            orders_by_status: statusRows.map((row) => ({
                status: row.status,
                count: Number(row.total)
            })),
            top_products: productRows.map((row) => ({
                product_id: row.product_id,
                name: row.name,
                units: Number(row.units),
                revenue: Number(row.revenue)
            })),
            top_shops: shopRows.map((row) => ({
                shop_id: row.shop_id,
                shop_name: row.shop_name,
                revenue: Number(row.revenue),
                orders: Number(row.orders)
            })),
            low_stock: stockRows.map((row) => ({
                product_id: row.product_id,
                name: row.name,
                stock: Number(row.stock)
            })),
            payment_methods: methodRows.map((row) => ({
                method: row.method,
                count: Number(row.total),
                amount: Number(row.amount)
            }))
        }
    });
});
