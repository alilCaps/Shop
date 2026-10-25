const { pdb, validId, handler } = require("../utils/helpers");

// GET /api/products/:productId  (public)
exports.getProductById = handler(async function getProductById(req, res) {
    const { productId } = req.params;

    if (!validId(productId)) {
        return res.status(400).json({ message: "Invalid product ID." });
    }

    const id = Number(productId);

    const [products] = await pdb.query(
        `SELECT
            p.product_id,
            p.product_name AS name,
            p.description,
            p.brand,
            p.base_price,
            p.rating,
            p.total_reviews,
            p.total_sold AS sold,
            c.category_name AS category,
            s.shop_id,
            s.shop_name,
            s.rating AS shop_rating
         FROM products p
         INNER JOIN categories c ON c.category_id = p.category_id
         INNER JOIN shops s ON s.shop_id = p.shop_id
         WHERE p.product_id = ?
           AND p.status = 'ACTIVE'
           AND c.status = 'ACTIVE'
           AND s.status = 'ACTIVE'`,
        [id]
    );

    if (products.length === 0) {
        return res.status(404).json({ message: "Product not found." });
    }

    const [variants] = await pdb.query(
        `SELECT
            pv.variant_id,
            pv.variant_name,
            pv.price,
            GREATEST(COALESCE(i.quantity - i.reserved_quantity, 0), 0) AS stock
         FROM product_variants pv
         LEFT JOIN inventory i ON i.variant_id = pv.variant_id
         WHERE pv.product_id = ? AND pv.status = 'ACTIVE'
         ORDER BY pv.variant_id`,
        [id]
    );

    const [images] = await pdb.query(
        `SELECT image_url, is_primary
         FROM product_images
         WHERE product_id = ?
         ORDER BY is_primary DESC, display_order ASC`,
        [id]
    );

    const [reviews] = await pdb.query(
        `SELECT
            r.review_id,
            r.rating,
            r.review_text,
            r.created_at,
            CONCAT(LEFT(u.username, 1), '***', RIGHT(u.username, 1)) AS reviewer
         FROM reviews r
         INNER JOIN users u ON u.user_id = r.user_id
         WHERE r.product_id = ? AND r.status = 'VISIBLE'
         ORDER BY r.created_at DESC
         LIMIT 20`,
        [id]
    );

    res.json({
        product: products[0],
        variants: variants.map((v) => ({ ...v, price: Number(v.price) })),
        images,
        reviews
    });
});
