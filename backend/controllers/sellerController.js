const {
    pdb,
    ORDER_TRANSITIONS,
    validId,
    handler,
    notify,
    restoreStock,
    closePaymentOnCancel
} = require("../utils/helpers");

const SELLER_PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "OUT_OF_STOCK", "INACTIVE"];

// Loads the seller's shop (may be null) onto req.shop.
exports.requireSeller = async function requireSeller(req, res, next) {
    try {
        const [users] = await pdb.query(
            `SELECT u.status, r.role_name
             FROM users u
             INNER JOIN roles r ON r.role_id = u.role_id
             WHERE u.user_id = ?`,
            [req.userId]
        );

        if (
            users.length === 0 ||
            String(users[0].role_name).toUpperCase() !== "SELLER"
        ) {
            return res.status(403).json({
                message: "Only seller accounts can use the seller centre."
            });
        }

        const [shops] = await pdb.query(
            "SELECT * FROM shops WHERE owner_id = ?",
            [req.userId]
        );

        req.shop = shops[0] || null;
        return next();
    } catch (error) {
        console.error("REQUIRE SELLER ERROR:", error);
        return res.status(500).json({ message: "Unable to verify seller." });
    }
};

function requireActiveShop(req, res) {
    if (!req.shop) {
        res.status(409).json({ message: "Create your shop first." });
        return false;
    }

    if (req.shop.status !== "ACTIVE") {
        res.status(403).json({
            message:
                req.shop.status === "PENDING"
                    ? "Your shop is waiting for admin approval."
                    : `Your shop is ${req.shop.status.toLowerCase()}.`
        });
        return false;
    }

    return true;
}

// --------------------------------------------------
// SHOP
// --------------------------------------------------
function cleanShop(body) {
    const text = (value, max) =>
        typeof value === "string" ? value.trim().slice(0, max) || null : null;

    return {
        shop_name: text(body.shop_name, 150),
        shop_description: text(body.shop_description, 2000),
        contact_email: text(body.contact_email, 100),
        contact_phone: text(body.contact_phone, 30),
        shop_address: text(body.shop_address, 255),
        shop_logo: text(body.shop_logo, 500)
    };
}

exports.getShop = handler(async function getShop(req, res) {
    res.json({ shop: req.shop });
});

exports.createShop = handler(async function createShop(req, res) {
    if (req.shop) {
        return res.status(409).json({ message: "You already have a shop." });
    }

    const shop = cleanShop(req.body);

    if (!shop.shop_name) {
        return res.status(400).json({ message: "Shop name is required." });
    }

    try {
        const [result] = await pdb.query(
            `INSERT INTO shops
                (owner_id, shop_name, shop_description, contact_email,
                 contact_phone, shop_address, shop_logo, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
            [
                req.userId,
                shop.shop_name,
                shop.shop_description,
                shop.contact_email,
                shop.contact_phone,
                shop.shop_address,
                shop.shop_logo
            ]
        );

        res.status(201).json({
            message: "Shop created. An admin will review it shortly.",
            shop_id: result.insertId
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "That shop name is already taken."
            });
        }

        throw error;
    }
});

exports.updateShop = handler(async function updateShop(req, res) {
    if (!req.shop) {
        return res.status(409).json({ message: "Create your shop first." });
    }

    const shop = cleanShop(req.body);

    if (!shop.shop_name) {
        return res.status(400).json({ message: "Shop name is required." });
    }

    try {
        await pdb.query(
            `UPDATE shops SET
                shop_name = ?, shop_description = ?, contact_email = ?,
                contact_phone = ?, shop_address = ?, shop_logo = ?
             WHERE shop_id = ?`,
            [
                shop.shop_name,
                shop.shop_description,
                shop.contact_email,
                shop.contact_phone,
                shop.shop_address,
                shop.shop_logo,
                req.shop.shop_id
            ]
        );

        res.json({ message: "Shop updated." });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "That shop name is already taken."
            });
        }

        throw error;
    }
});

// --------------------------------------------------
// PRODUCTS
// --------------------------------------------------
exports.listProducts = handler(async function listProducts(req, res) {
    if (!req.shop) return res.json({ products: [] });

    const [rows] = await pdb.query(
        `SELECT
            p.product_id, p.product_name, p.description, p.brand,
            p.base_price, p.status, p.category_id, c.category_name,
            p.rating, p.total_sold,
            COALESCE(SUM(i.quantity - i.reserved_quantity), 0) AS stock
         FROM products p
         INNER JOIN categories c ON c.category_id = p.category_id
         LEFT JOIN product_variants pv
            ON pv.product_id = p.product_id AND pv.status = 'ACTIVE'
         LEFT JOIN inventory i ON i.variant_id = pv.variant_id
         WHERE p.shop_id = ?
         GROUP BY
            p.product_id, p.product_name, p.description, p.brand,
            p.base_price, p.status, p.category_id, c.category_name,
            p.rating, p.total_sold
         ORDER BY p.product_id DESC`,
        [req.shop.shop_id]
    );

    res.json({ products: rows });
});

function parseProduct(body, { partial }) {
    const errors = [];
    const out = {};

    if (!partial || body.product_name !== undefined) {
        const name =
            typeof body.product_name === "string" ? body.product_name.trim() : "";

        if (!name || name.length > 255) {
            errors.push("Product name is required (max 255 characters).");
        }

        out.product_name = name;
    }

    if (!partial || body.base_price !== undefined) {
        const price = Number(body.base_price);

        if (!Number.isFinite(price) || price < 0 || price > 99999999) {
            errors.push("Price must be a valid non-negative number.");
        }

        out.base_price = price;
    }

    if (!partial || body.category_id !== undefined) {
        if (!validId(body.category_id)) {
            errors.push("Choose a category.");
        }

        out.category_id = Number(body.category_id);
    }

    if (!partial || body.stock !== undefined) {
        const stock = Number(body.stock);

        if (!Number.isInteger(stock) || stock < 0 || stock > 1000000) {
            errors.push("Stock must be a whole number of 0 or more.");
        }

        out.stock = stock;
    }

    if (body.status !== undefined || !partial) {
        const status = String(body.status || "ACTIVE").toUpperCase();

        if (!SELLER_PRODUCT_STATUSES.includes(status)) {
            errors.push("Invalid product status.");
        }

        out.status = status;
    }

    if (body.description !== undefined) {
        out.description =
            typeof body.description === "string"
                ? body.description.trim().slice(0, 5000) || null
                : null;
    }

    if (body.brand !== undefined) {
        out.brand =
            typeof body.brand === "string"
                ? body.brand.trim().slice(0, 100) || null
                : null;
    }

    return { errors, data: out };
}

exports.createProduct = handler(async function createProduct(req, res) {
    if (!requireActiveShop(req, res)) return;

    const { errors, data } = parseProduct(req.body, { partial: false });

    if (errors.length > 0) {
        return res.status(400).json({ message: errors[0] });
    }

    const [category] = await pdb.query(
        "SELECT category_id FROM categories WHERE category_id = ? AND status = 'ACTIVE'",
        [data.category_id]
    );

    if (category.length === 0) {
        return res.status(400).json({ message: "Category does not exist." });
    }

    const conn = await pdb.getConnection();

    try {
        await conn.beginTransaction();

        const [product] = await conn.query(
            `INSERT INTO products
                (shop_id, category_id, product_name, description, brand,
                 base_price, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                req.shop.shop_id,
                data.category_id,
                data.product_name,
                data.description ?? null,
                data.brand ?? null,
                data.base_price,
                data.status
            ]
        );

        const [variant] = await conn.query(
            `INSERT INTO product_variants
                (product_id, sku, variant_name, price, status)
             VALUES (?, ?, 'Standard', ?, 'ACTIVE')`,
            [product.insertId, `SKU-${product.insertId}-STD`, data.base_price]
        );

        await conn.query(
            "INSERT INTO inventory (variant_id, quantity, reserved_quantity) VALUES (?, ?, 0)",
            [variant.insertId, data.stock]
        );

        await conn.commit();

        res.status(201).json({
            message: "Product created.",
            product_id: product.insertId
        });
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
});

exports.updateProduct = handler(async function updateProduct(req, res) {
    if (!requireActiveShop(req, res)) return;

    const { productId } = req.params;

    if (!validId(productId)) {
        return res.status(400).json({ message: "Invalid product." });
    }

    const { errors, data } = parseProduct(req.body, { partial: true });

    if (errors.length > 0) {
        return res.status(400).json({ message: errors[0] });
    }

    const [owned] = await pdb.query(
        "SELECT product_id, status FROM products WHERE product_id = ? AND shop_id = ?",
        [Number(productId), req.shop.shop_id]
    );

    if (owned.length === 0) {
        return res.status(404).json({ message: "Product not found." });
    }

    if (owned[0].status === "BANNED") {
        return res.status(403).json({
            message: "This product was banned by an admin."
        });
    }

    if (data.category_id !== undefined) {
        const [category] = await pdb.query(
            "SELECT category_id FROM categories WHERE category_id = ? AND status = 'ACTIVE'",
            [data.category_id]
        );

        if (category.length === 0) {
            return res.status(400).json({ message: "Category does not exist." });
        }
    }

    const { stock, ...productFields } = data;
    const entries = Object.entries(productFields);

    const conn = await pdb.getConnection();

    try {
        await conn.beginTransaction();

        if (entries.length > 0) {
            await conn.query(
                `UPDATE products SET ${entries.map(([k]) => `${k} = ?`).join(", ")}
                 WHERE product_id = ?`,
                [...entries.map(([, v]) => v), Number(productId)]
            );
        }

        const [variants] = await conn.query(
            `SELECT variant_id FROM product_variants
             WHERE product_id = ? AND status = 'ACTIVE'
             ORDER BY variant_id`,
            [Number(productId)]
        );

        let variantId = variants[0]?.variant_id;

        if (!variantId) {
            const [created] = await conn.query(
                `INSERT INTO product_variants
                    (product_id, sku, variant_name, price, status)
                 SELECT product_id, CONCAT('SKU-', product_id, '-STD'),
                        'Standard', base_price, 'ACTIVE'
                 FROM products WHERE product_id = ?`,
                [Number(productId)]
            );

            variantId = created.insertId;
        }

        if (data.base_price !== undefined && variants.length <= 1) {
            await conn.query(
                "UPDATE product_variants SET price = ? WHERE variant_id = ?",
                [data.base_price, variantId]
            );
        }

        if (stock !== undefined) {
            await conn.query(
                `INSERT INTO inventory (variant_id, quantity, reserved_quantity)
                 VALUES (?, ?, 0)
                 ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`,
                [variantId, stock]
            );
        }

        await conn.commit();
        res.json({ message: "Product updated." });
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
});

// Products that were ordered can never be removed, so "delete" archives.
exports.archiveProduct = handler(async function archiveProduct(req, res) {
    const { productId } = req.params;

    if (!validId(productId)) {
        return res.status(400).json({ message: "Invalid product." });
    }

    if (!req.shop) {
        return res.status(404).json({ message: "Product not found." });
    }

    const [result] = await pdb.query(
        `UPDATE products SET status = 'INACTIVE'
         WHERE product_id = ? AND shop_id = ? AND status <> 'BANNED'`,
        [Number(productId), req.shop.shop_id]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Product not found." });
    }

    res.json({ message: "Product archived." });
});

// --------------------------------------------------
// ORDERS
// --------------------------------------------------
async function fetchShopOrders(shopId, { status, limit } = {}) {
    const params = [shopId];
    let where = "oi.shop_id = ?";

    if (status) {
        where += " AND o.status = ?";
        params.push(status);
    }

    const [orders] = await pdb.query(
        `SELECT
            o.order_id, o.order_number, o.status, o.placed_at, o.notes,
            CONCAT_WS(' ', u.first_name, u.last_name) AS customer_name,
            u.username,
            SUM(oi.subtotal) AS shop_total,
            SUM(oi.quantity) AS item_count,
            pay.payment_method, pay.status AS payment_status,
            sh.courier, sh.tracking_number
         FROM orders o
         INNER JOIN order_items oi ON oi.order_id = o.order_id
         INNER JOIN users u ON u.user_id = o.user_id
         LEFT JOIN payments pay ON pay.order_id = o.order_id
         LEFT JOIN shipments sh ON sh.order_id = o.order_id
         WHERE ${where}
         GROUP BY
            o.order_id, o.order_number, o.status, o.placed_at, o.notes,
            u.first_name, u.last_name, u.username,
            pay.payment_method, pay.status, sh.courier, sh.tracking_number
         ORDER BY o.placed_at DESC, o.order_id DESC
         ${limit ? `LIMIT ${Number(limit)}` : ""}`,
        params
    );

    if (orders.length === 0) return [];

    const ids = orders.map((order) => order.order_id);

    const [items] = await pdb.query(
        `SELECT order_item_id, order_id, product_id, product_name,
                variant_name, quantity, unit_price, subtotal
         FROM order_items
         WHERE order_id IN (?) AND shop_id = ?`,
        [ids, shopId]
    );

    const [addresses] = await pdb.query(
        "SELECT * FROM order_addresses WHERE order_id IN (?)",
        [ids]
    );

    return orders.map((order) => ({
        ...order,
        items: items.filter((item) => item.order_id === order.order_id),
        address: addresses.find((a) => a.order_id === order.order_id) || null
    }));
}

exports.listOrders = handler(async function listOrders(req, res) {
    if (!req.shop) return res.json({ orders: [] });

    const status = req.query.status
        ? String(req.query.status).toUpperCase()
        : undefined;

    res.json({ orders: await fetchShopOrders(req.shop.shop_id, { status }) });
});

exports.updateOrderStatus = handler(async function updateOrderStatus(req, res) {
    if (!requireActiveShop(req, res)) return;

    const { orderId } = req.params;
    const status = String(req.body.status || "").toUpperCase();

    if (!validId(orderId)) {
        return res.status(400).json({ message: "Invalid order." });
    }

    // Sellers may fulfil and cancel orders, but never refund or complete them.
    const sellerAllowed = [
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED"
    ];

    if (!sellerAllowed.includes(status)) {
        return res.status(400).json({ message: "Invalid status for sellers." });
    }

    const conn = await pdb.getConnection();

    try {
        await conn.beginTransaction();

        const [rows] = await conn.query(
            `SELECT o.order_id, o.order_number, o.user_id, o.status,
                    COUNT(DISTINCT oi.shop_id) AS shop_count,
                    SUM(oi.shop_id = ?) AS mine
             FROM orders o
             INNER JOIN order_items oi ON oi.order_id = o.order_id
             WHERE o.order_id = ?
             GROUP BY o.order_id, o.order_number, o.user_id, o.status
             FOR UPDATE`,
            [req.shop.shop_id, Number(orderId)]
        );

        const order = rows[0];

        if (!order || Number(order.mine) === 0) {
            await conn.rollback();
            return res.status(404).json({ message: "Order not found." });
        }

        if (Number(order.shop_count) > 1) {
            await conn.rollback();
            return res.status(409).json({
                message: "This order contains items from several shops. Ask an admin to update it."
            });
        }

        if (!ORDER_TRANSITIONS[order.status]?.includes(status)) {
            await conn.rollback();
            return res.status(409).json({
                message: `Order cannot move from ${order.status} to ${status}.`
            });
        }

        await conn.query("UPDATE orders SET status = ? WHERE order_id = ?", [
            status,
            order.order_id
        ]);

        if (status === "SHIPPED") {
            const courier =
                typeof req.body.courier === "string"
                    ? req.body.courier.trim().slice(0, 100) || null
                    : null;
            const tracking =
                typeof req.body.tracking_number === "string"
                    ? req.body.tracking_number.trim().slice(0, 150) || null
                    : null;

            await conn.query(
                `INSERT INTO shipments
                    (order_id, courier, tracking_number, status, shipped_at)
                 VALUES (?, ?, ?, 'IN_TRANSIT', NOW())
                 ON DUPLICATE KEY UPDATE
                    courier = VALUES(courier),
                    tracking_number = VALUES(tracking_number),
                    status = 'IN_TRANSIT',
                    shipped_at = NOW()`,
                [order.order_id, courier, tracking]
            );
        }

        if (status === "DELIVERED") {
            await conn.query(
                `UPDATE shipments
                 SET status = 'DELIVERED', delivered_at = NOW()
                 WHERE order_id = ?`,
                [order.order_id]
            );
        }

        if (status === "CANCELLED") {
            await restoreStock(conn, order.order_id);
            await closePaymentOnCancel(conn, order.order_id);
        }

        const messages = {
            PROCESSING: "is being prepared by the seller",
            SHIPPED: "has been shipped",
            DELIVERED: "was delivered. Please confirm you received it",
            CANCELLED: "was cancelled by the seller"
        };

        await notify(
            conn,
            order.user_id,
            "Order update",
            `Your order ${order.order_number} ${messages[status]}.`,
            "SHIPPING",
            order.order_id
        );

        await conn.commit();
        res.json({ message: "Order updated." });
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
});

// --------------------------------------------------
// DASHBOARD
// --------------------------------------------------
exports.getDashboard = handler(async function getDashboard(req, res) {
    if (!req.shop) {
        return res.json({ shop: null, stats: null, recent_orders: [] });
    }

    const shopId = req.shop.shop_id;

    const [orderStats] = await pdb.query(
        `SELECT
            COUNT(*) AS total_orders,
            COALESCE(SUM(status IN ('PAID', 'PROCESSING')), 0) AS to_ship,
            COALESCE(SUM(status = 'PENDING_PAYMENT'), 0) AS to_pay,
            COALESCE(SUM(status = 'SHIPPED'), 0) AS shipped,
            COALESCE(SUM(
                CASE WHEN status IN ('PAID','PROCESSING','SHIPPED','DELIVERED','COMPLETED')
                     THEN shop_sales ELSE 0 END
            ), 0) AS revenue
         FROM (
            SELECT o.order_id, o.status, SUM(oi.subtotal) AS shop_sales
            FROM orders o
            INNER JOIN order_items oi ON oi.order_id = o.order_id
            WHERE oi.shop_id = ?
            GROUP BY o.order_id, o.status
         ) t`,
        [shopId]
    );

    const [productStats] = await pdb.query(
        `SELECT
            COUNT(*) AS total_products,
            COALESCE(SUM(status = 'ACTIVE'), 0) AS active_products,
            COALESCE(SUM(stock <= 5 AND status IN ('ACTIVE','OUT_OF_STOCK')), 0) AS low_stock
         FROM (
            SELECT p.product_id, p.status,
                   COALESCE(SUM(i.quantity - i.reserved_quantity), 0) AS stock
            FROM products p
            LEFT JOIN product_variants pv
                ON pv.product_id = p.product_id AND pv.status = 'ACTIVE'
            LEFT JOIN inventory i ON i.variant_id = pv.variant_id
            WHERE p.shop_id = ?
            GROUP BY p.product_id, p.status
         ) t`,
        [shopId]
    );

    res.json({
        shop: req.shop,
        stats: { ...orderStats[0], ...productStats[0] },
        recent_orders: await fetchShopOrders(shopId, { limit: 5 })
    });
});
