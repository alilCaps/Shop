const db = require("../config/db");

// CUSTOMER DASHBOARD STATISTICS
const getDashboardStats = (req, res) => {
    const userId = req.params.userId;

    if (!/^\d+$/.test(userId) || Number(userId) <= 0) {
        return res.status(400).json({
            message: "Invalid user ID."
        });
    }

    const sql = `
        SELECT
            COALESCE(
                SUM(
                    CASE
                        WHEN status = 'SHIPPED' THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS to_receive,

            COALESCE(
                SUM(
                    CASE
                        WHEN status = 'DELIVERED' THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS to_review,

            COUNT(*) AS total_orders
        FROM orders
        WHERE user_id = ?
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("DASHBOARD STATS ERROR:", err);

            return res.status(500).json({
                message: "Unable to load order statistics."
            });
        }

        return res.status(200).json(results[0]);
    });
};

// CUSTOMER ORDER ON THE WAY
const getOrderOnTheWay = (req, res) => {
    const userId = req.params.userId;

    if (!/^\d+$/.test(userId) || Number(userId) <= 0) {
        return res.status(400).json({
            message: "Invalid user ID."
        });
    }

    const sql = `
        SELECT
            order_id,
            order_number,
            status,
            subtotal,
            shipping_fee,
            discount_amount,
            total_amount,
            placed_at
        FROM orders
        WHERE user_id = ?
            AND status = 'SHIPPED'
        ORDER BY placed_at DESC
        LIMIT 1
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("SHIPPED ORDER ERROR:", err);

            return res.status(500).json({
                message: "Unable to load your order."
            });
        }

        return res.status(200).json({
            order: results.length > 0 ? results[0] : null
        });
    });
};

// CUSTOMER RECENT ORDERS
const getCustomerOrders = (req, res) => {
    const userId = req.params.userId;

    if (!/^\d+$/.test(userId) || Number(userId) <= 0) {
        return res.status(400).json({
            message: "Invalid user ID."
        });
    }

    const sql = `
        SELECT
            order_id,
            order_number,
            status,
            total_amount,
            placed_at
        FROM orders
        WHERE user_id = ?
        ORDER BY placed_at DESC
        LIMIT 5
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("CUSTOMER ORDERS ERROR:", err);

            return res.status(500).json({
                message: "Unable to load your orders."
            });
        }

        return res.status(200).json(results);
    });
};

module.exports = {
    getDashboardStats,
    getOrderOnTheWay,
    getCustomerOrders
};