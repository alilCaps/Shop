const db = require("../config/db");

const getCategories = (req, res) => {
    const sql = `
        SELECT
            MIN(category_id) AS category_id,
            category_name
        FROM categories
        WHERE status = 'ACTIVE'
        GROUP BY category_name
        ORDER BY MIN(category_id)
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("CATEGORIES MYSQL ERROR:", err);

            return res.status(500).json({
                message: "Unable to load categories."
            });
        }

        return res.status(200).json(results);
    });
};

module.exports = {
    getCategories
};