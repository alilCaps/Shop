const db = require("../config/db");

const getProducts = (req, res) => {
    const sql = `
        SELECT
            p.product_id,
            p.product_name AS name,
            p.description,
            p.brand,
            p.base_price,
            COALESCE(
                MIN(pv.price),
                p.base_price
            ) AS price,
            p.rating,
            p.total_reviews,
            p.total_sold AS sold,
            c.category_name AS category,
            (
                SELECT pi.image_url
                FROM product_images pi
                WHERE pi.product_id = p.product_id
                ORDER BY pi.is_primary DESC, pi.display_order ASC
                LIMIT 1
            ) AS image_url,
            COALESCE(
                SUM(
                    COALESCE(i.quantity, 0) -
                    COALESCE(i.reserved_quantity, 0)
                ),
                0
            ) AS stock
        FROM products p
        INNER JOIN categories c
            ON p.category_id = c.category_id
        INNER JOIN shops s
            ON p.shop_id = s.shop_id
        LEFT JOIN product_variants pv
            ON p.product_id = pv.product_id
            AND pv.status = 'ACTIVE'
        LEFT JOIN inventory i
            ON pv.variant_id = i.variant_id
        WHERE p.status = 'ACTIVE'
            AND c.status = 'ACTIVE'
            AND s.status = 'ACTIVE'
        GROUP BY
            p.product_id,
            p.product_name,
            p.description,
            p.brand,
            p.base_price,
            p.rating,
            p.total_reviews,
            p.total_sold,
            c.category_name
        ORDER BY p.product_id ASC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("PRODUCTS MYSQL ERROR:", err);

            return res.status(500).json({
                message: "Unable to load products."
            });
        }

        return res.status(200).json(results);
    });
};

module.exports = {
    getProducts
};