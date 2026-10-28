const {
    pdb,
    PAYMENT_METHODS,
    validId,
    generateOrderNumber,
    handler,
    getShippingSettings,
    calculateShipping,
    notify,
    restoreStock,
    closePaymentOnCancel
} = require("../utils/helpers");
const { attachReturnInfo } = require("../utils/returns");

const IMAGE_SQL = `(
    SELECT pi.image_url
    FROM product_images pi
    WHERE pi.product_id = p.product_id
    ORDER BY pi.is_primary DESC, pi.display_order ASC
    LIMIT 1
)`;

// --------------------------------------------------
// CART
// --------------------------------------------------
async function getOrCreateCartId(conn, userId) {
    await conn.query("INSERT IGNORE INTO carts (user_id) VALUES (?)", [userId]);

    const [rows] = await conn.query(
        "SELECT cart_id FROM carts WHERE user_id = ?",
        [userId]
    );

    return rows[0].cart_id;
}

async function fetchCartItems(conn, userId) {
    const [rows] = await conn.query(
        `SELECT
            ci.cart_item_id,
            ci.quantity,
            v.variant_id,
            v.variant_name,
            v.price,
            v.status AS variant_status,
            p.product_id,
            p.product_name,
            p.status AS product_status,
            s.shop_id,
            s.shop_name,
            s.status AS shop_status,
            s.owner_id,
            GREATEST(COALESCE(i.quantity - i.reserved_quantity, 0), 0) AS stock,
            ${IMAGE_SQL} AS image_url
         FROM carts c
         INNER JOIN cart_items ci ON ci.cart_id = c.cart_id
         INNER JOIN product_variants v ON v.variant_id = ci.variant_id
         INNER JOIN products p ON p.product_id = v.product_id
         INNER JOIN shops s ON s.shop_id = p.shop_id
         LEFT JOIN inventory i ON i.variant_id = v.variant_id
         WHERE c.user_id = ?
         ORDER BY ci.added_at DESC`,
        [userId]
    );

    return rows.map((row) => ({
        ...row,
        price: Number(row.price),
        available:
            row.variant_status === "ACTIVE" &&
            row.product_status === "ACTIVE" &&
            row.shop_status === "ACTIVE" &&
            row.stock > 0,
        own_product: Number(row.owner_id) === Number(userId)
    }));
}

exports.getCart = handler(async function getCart(req, res) {
    const items = await fetchCartItems(pdb, req.userId);
    const shipping = await getShippingSettings();

    res.json({ items, shipping });
});

exports.addToCart = handler(async function addToCart(req, res) {
    const quantity = Number(req.body.quantity ?? 1);
    let variantId = req.body.variant_id;

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return res.status(400).json({ message: "Invalid quantity." });
    }

    if (!variantId && validId(req.body.product_id)) {
        const [first] = await pdb.query(
            `SELECT variant_id FROM product_variants
             WHERE product_id = ? AND status = 'ACTIVE'
             ORDER BY variant_id LIMIT 1`,
            [Number(req.body.product_id)]
        );

        variantId = first[0]?.variant_id;
    }

    if (!validId(variantId)) {
        return res.status(400).json({ message: "Choose a valid product." });
    }

    const [rows] = await pdb.query(
        `SELECT
            v.variant_id, v.status AS variant_status,
            p.status AS product_status, p.product_name,
            s.status AS shop_status, s.owner_id,
            GREATEST(COALESCE(i.quantity - i.reserved_quantity, 0), 0) AS stock
         FROM product_variants v
         INNER JOIN products p ON p.product_id = v.product_id
         INNER JOIN shops s ON s.shop_id = p.shop_id
         LEFT JOIN inventory i ON i.variant_id = v.variant_id
         WHERE v.variant_id = ?`,
        [Number(variantId)]
    );

    const target = rows[0];

    if (
        !target ||
        target.variant_status !== "ACTIVE" ||
        target.product_status !== "ACTIVE" ||
        target.shop_status !== "ACTIVE"
    ) {
        return res.status(404).json({
            message: "This product is not available."
        });
    }

    if (Number(target.owner_id) === req.userId) {
        return res.status(403).json({
            message: "You cannot buy products from your own shop."
        });
    }

    const cartId = await getOrCreateCartId(pdb, req.userId);

    const [existing] = await pdb.query(
        "SELECT cart_item_id, quantity FROM cart_items WHERE cart_id = ? AND variant_id = ?",
        [cartId, Number(variantId)]
    );

    const newQuantity = (existing[0]?.quantity || 0) + quantity;

    if (newQuantity > target.stock) {
        return res.status(409).json({
            message:
                target.stock > 0
                    ? `Only ${target.stock} left in stock.`
                    : "This product is out of stock."
        });
    }

    let cartItemId;

    if (existing.length > 0) {
        cartItemId = existing[0].cart_item_id;

        await pdb.query(
            "UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?",
            [newQuantity, cartItemId]
        );
    } else {
        const [result] = await pdb.query(
            "INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (?, ?, ?)",
            [cartId, Number(variantId), quantity]
        );

        cartItemId = result.insertId;
    }

    res.status(201).json({
        message: "Added to cart.",
        cart_item_id: cartItemId
    });
});

exports.updateCartItem = handler(async function updateCartItem(req, res) {
    const { cartItemId } = req.params;
    const quantity = Number(req.body.quantity);

    if (!validId(cartItemId)) {
        return res.status(400).json({ message: "Invalid cart item." });
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return res.status(400).json({ message: "Invalid quantity." });
    }

    const [rows] = await pdb.query(
        `SELECT
            ci.cart_item_id,
            GREATEST(COALESCE(i.quantity - i.reserved_quantity, 0), 0) AS stock
         FROM cart_items ci
         INNER JOIN carts c ON c.cart_id = ci.cart_id
         LEFT JOIN inventory i ON i.variant_id = ci.variant_id
         WHERE ci.cart_item_id = ? AND c.user_id = ?`,
        [Number(cartItemId), req.userId]
    );

    if (rows.length === 0) {
        return res.status(404).json({ message: "Cart item not found." });
    }

    if (quantity > rows[0].stock) {
        return res.status(409).json({
            message: `Only ${rows[0].stock} left in stock.`
        });
    }

    await pdb.query(
        "UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?",
        [quantity, Number(cartItemId)]
    );

    res.json({ message: "Cart updated." });
});

exports.removeCartItem = handler(async function removeCartItem(req, res) {
    const { cartItemId } = req.params;

    if (!validId(cartItemId)) {
        return res.status(400).json({ message: "Invalid cart item." });
    }

    await pdb.query(
        `DELETE ci FROM cart_items ci
         INNER JOIN carts c ON c.cart_id = ci.cart_id
         WHERE ci.cart_item_id = ? AND c.user_id = ?`,
        [Number(cartItemId), req.userId]
    );

    res.json({ message: "Item removed." });
});

// --------------------------------------------------
// WISHLIST
// --------------------------------------------------
exports.getWishlist = handler(async function getWishlist(req, res) {
    const [rows] = await pdb.query(
        `SELECT
            w.wishlist_id,
            p.product_id,
            p.product_name AS name,
            COALESCE(MIN(pv.price), p.base_price) AS price,
            p.rating,
            p.total_sold AS sold,
            p.status,
            ${IMAGE_SQL} AS image_url
         FROM wishlists w
         INNER JOIN products p ON p.product_id = w.product_id
         LEFT JOIN product_variants pv
            ON pv.product_id = p.product_id AND pv.status = 'ACTIVE'
         WHERE w.user_id = ?
         GROUP BY
            w.wishlist_id, w.created_at, p.product_id, p.product_name,
            p.base_price, p.rating, p.total_sold, p.status
         ORDER BY w.created_at DESC`,
        [req.userId]
    );

    res.json({ items: rows });
});

exports.addToWishlist = handler(async function addToWishlist(req, res) {
    const productId = req.body.product_id;

    if (!validId(productId)) {
        return res.status(400).json({ message: "Invalid product." });
    }

    const [product] = await pdb.query(
        "SELECT product_id FROM products WHERE product_id = ? AND status = 'ACTIVE'",
        [Number(productId)]
    );

    if (product.length === 0) {
        return res.status(404).json({ message: "Product not found." });
    }

    await pdb.query(
        "INSERT IGNORE INTO wishlists (user_id, product_id) VALUES (?, ?)",
        [req.userId, Number(productId)]
    );

    res.status(201).json({ message: "Added to wishlist." });
});

exports.removeFromWishlist = handler(async function removeFromWishlist(req, res) {
    const { productId } = req.params;

    if (!validId(productId)) {
        return res.status(400).json({ message: "Invalid product." });
    }

    await pdb.query(
        "DELETE FROM wishlists WHERE user_id = ? AND product_id = ?",
        [req.userId, Number(productId)]
    );

    res.json({ message: "Removed from wishlist." });
});

// --------------------------------------------------
// ADDRESSES
// --------------------------------------------------
const ADDRESS_TYPES = ["HOME", "WORK", "OTHER"];

function cleanAddress(body) {
    const text = (value, max) =>
        typeof value === "string" ? value.trim().slice(0, max) : "";

    const address = {
        recipient_name: text(body.recipient_name, 150),
        phone: text(body.phone, 30),
        address_line: text(body.address_line, 255),
        barangay: text(body.barangay, 100) || null,
        city: text(body.city, 100),
        province: text(body.province, 100),
        region: text(body.region, 100) || null,
        postal_code: text(body.postal_code, 20) || null,
        address_type: ADDRESS_TYPES.includes(
            String(body.address_type || "").toUpperCase()
        )
            ? String(body.address_type).toUpperCase()
            : "HOME",
        is_default: Boolean(body.is_default)
    };

    const required = [
        "recipient_name",
        "phone",
        "address_line",
        "city",
        "province"
    ];
    const missing = required.filter((key) => !address[key]);

    return { address, missing };
}

exports.getAddresses = handler(async function getAddresses(req, res) {
    const [rows] = await pdb.query(
        `SELECT * FROM addresses
         WHERE user_id = ?
         ORDER BY is_default DESC, address_id DESC`,
        [req.userId]
    );

    res.json({ addresses: rows });
});

exports.createAddress = handler(async function createAddress(req, res) {
    const { address, missing } = cleanAddress(req.body);

    if (missing.length > 0) {
        return res.status(400).json({
            message: "Please complete the required address fields."
        });
    }

    const conn = await pdb.getConnection();

    try {
        await conn.beginTransaction();

        const [count] = await conn.query(
            "SELECT COUNT(*) AS total FROM addresses WHERE user_id = ?",
            [req.userId]
        );

        const makeDefault = address.is_default || count[0].total === 0;

        if (makeDefault) {
            await conn.query(
                "UPDATE addresses SET is_default = 0 WHERE user_id = ?",
                [req.userId]
            );
        }

        const [result] = await conn.query(
            `INSERT INTO addresses
                (user_id, recipient_name, phone, address_line, barangay, city,
                 province, region, postal_code, address_type, is_default)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.userId,
                address.recipient_name,
                address.phone,
                address.address_line,
                address.barangay,
                address.city,
                address.province,
                address.region,
                address.postal_code,
                address.address_type,
                makeDefault ? 1 : 0
            ]
        );

        await conn.commit();

        res.status(201).json({
            message: "Address saved.",
            address_id: result.insertId
        });
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
});

exports.updateAddress = handler(async function updateAddress(req, res) {
    const { addressId } = req.params;

    if (!validId(addressId)) {
        return res.status(400).json({ message: "Invalid address." });
    }

    const { address, missing } = cleanAddress(req.body);

    if (missing.length > 0) {
        return res.status(400).json({
            message: "Please complete the required address fields."
        });
    }

    const conn = await pdb.getConnection();

    try {
        await conn.beginTransaction();

        const [existing] = await conn.query(
            "SELECT address_id FROM addresses WHERE address_id = ? AND user_id = ?",
            [Number(addressId), req.userId]
        );

        if (existing.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: "Address not found." });
        }

        if (address.is_default) {
            await conn.query(
                "UPDATE addresses SET is_default = 0 WHERE user_id = ?",
                [req.userId]
            );
        }

        await conn.query(
            `UPDATE addresses SET
                recipient_name = ?, phone = ?, address_line = ?, barangay = ?,
                city = ?, province = ?, region = ?, postal_code = ?,
                address_type = ?, is_default = IF(?, 1, is_default)
             WHERE address_id = ? AND user_id = ?`,
            [
                address.recipient_name,
                address.phone,
                address.address_line,
                address.barangay,
                address.city,
                address.province,
                address.region,
                address.postal_code,
                address.address_type,
                address.is_default ? 1 : 0,
                Number(addressId),
                req.userId
            ]
        );

        await conn.commit();
        res.json({ message: "Address updated." });
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
});

exports.setDefaultAddress = handler(async function setDefaultAddress(req, res) {
    const { addressId } = req.params;

    if (!validId(addressId)) {
        return res.status(400).json({ message: "Invalid address." });
    }

    const [existing] = await pdb.query(
        "SELECT address_id FROM addresses WHERE address_id = ? AND user_id = ?",
        [Number(addressId), req.userId]
    );

    if (existing.length === 0) {
        return res.status(404).json({ message: "Address not found." });
    }

    await pdb.query(
        "UPDATE addresses SET is_default = (address_id = ?) WHERE user_id = ?",
        [Number(addressId), req.userId]
    );

    res.json({ message: "Default address updated." });
});

exports.deleteAddress = handler(async function deleteAddress(req, res) {
    const { addressId } = req.params;

    if (!validId(addressId)) {
        return res.status(400).json({ message: "Invalid address." });
    }

    const [existing] = await pdb.query(
        "SELECT address_id, is_default FROM addresses WHERE address_id = ? AND user_id = ?",
        [Number(addressId), req.userId]
    );

    if (existing.length === 0) {
        return res.status(404).json({ message: "Address not found." });
    }

    await pdb.query("DELETE FROM addresses WHERE address_id = ?", [
        Number(addressId)
    ]);

    if (existing[0].is_default) {
        await pdb.query(
            `UPDATE addresses SET is_default = 1
             WHERE user_id = ?
             ORDER BY address_id DESC LIMIT 1`,
            [req.userId]
        );
    }

    res.json({ message: "Address deleted." });
});

// --------------------------------------------------
// PAYMENTS (history)
// --------------------------------------------------
exports.getPayments = handler(async function getPayments(req, res) {
    const [rows] = await pdb.query(
        `SELECT
            pay.payment_id,
            pay.order_id,
            o.order_number,
            o.status AS order_status,
            pay.payment_method,
            pay.transaction_reference,
            pay.amount,
            pay.status,
            pay.paid_at,
            pay.created_at
         FROM payments pay
         INNER JOIN orders o ON o.order_id = pay.order_id
         WHERE o.user_id = ?
         ORDER BY pay.created_at DESC`,
        [req.userId]
    );

    res.json({ payments: rows });
});

// --------------------------------------------------
// CHECKOUT
// --------------------------------------------------
exports.checkout = handler(async function checkout(req, res) {
    const { address_id, payment_method, cart_item_ids, note } = req.body;
    const method = String(payment_method || "").toUpperCase();

    if (!PAYMENT_METHODS.includes(method)) {
        return res.status(400).json({ message: "Choose a payment method." });
    }

    if (!validId(address_id)) {
        return res.status(400).json({ message: "Choose a delivery address." });
    }

    const selectedIds = Array.isArray(cart_item_ids)
        ? cart_item_ids.filter(validId).map(Number)
        : null;

    const conn = await pdb.getConnection();

    try {
        await conn.beginTransaction();

        const [addressRows] = await conn.query(
            "SELECT * FROM addresses WHERE address_id = ? AND user_id = ?",
            [Number(address_id), req.userId]
        );

        if (addressRows.length === 0) {
            await conn.rollback();
            return res.status(400).json({
                message: "The selected address was not found."
            });
        }

        const address = addressRows[0];

        let items = await fetchCartItems(conn, req.userId);

        if (selectedIds) {
            items = items.filter((item) =>
                selectedIds.includes(item.cart_item_id)
            );
        }

        if (items.length === 0) {
            await conn.rollback();
            return res.status(400).json({
                message: "Your selection is empty."
            });
        }

        const unavailable = items.find(
            (item) => !item.available || item.own_product
        );

        if (unavailable) {
            await conn.rollback();
            return res.status(409).json({
                message: `"${unavailable.product_name}" is no longer available. Remove it from your cart to continue.`
            });
        }

        // Reserve stock atomically; fails if somebody else bought it first.
        for (const item of items) {
            const [update] = await conn.query(
                `UPDATE inventory
                 SET quantity = quantity - ?
                 WHERE variant_id = ?
                   AND quantity - reserved_quantity >= ?`,
                [item.quantity, item.variant_id, item.quantity]
            );

            if (update.affectedRows === 0) {
                await conn.rollback();
                return res.status(409).json({
                    message: `Not enough stock for "${item.product_name}".`
                });
            }
        }

        const settings = await getShippingSettings(conn);

        // One order per shop, like the real Shopee.
        const byShop = new Map();

        for (const item of items) {
            if (!byShop.has(item.shop_id)) byShop.set(item.shop_id, []);
            byShop.get(item.shop_id).push(item);
        }

        const created = [];
        const cleanNote =
            typeof note === "string" ? note.trim().slice(0, 500) || null : null;

        for (const [shopId, shopItems] of byShop) {
            const subtotal = shopItems.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
            );
            const shippingFee = calculateShipping(subtotal, settings);
            const total = subtotal + shippingFee;
            const cod = method === "CASH_ON_DELIVERY";
            const status = cod ? "PROCESSING" : "PENDING_PAYMENT";
            const orderNumber = generateOrderNumber();

            const [orderResult] = await conn.query(
                `INSERT INTO orders
                    (order_number, user_id, subtotal, shipping_fee,
                     discount_amount, total_amount, status, notes)
                 VALUES (?, ?, ?, ?, 0, ?, ?, ?)`,
                [
                    orderNumber,
                    req.userId,
                    subtotal,
                    shippingFee,
                    total,
                    status,
                    cleanNote
                ]
            );

            const orderId = orderResult.insertId;

            for (const item of shopItems) {
                await conn.query(
                    `INSERT INTO order_items
                        (order_id, product_id, variant_id, shop_id,
                         product_name, variant_name, quantity, unit_price, subtotal)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        orderId,
                        item.product_id,
                        item.variant_id,
                        shopId,
                        item.product_name,
                        item.variant_name,
                        item.quantity,
                        item.price,
                        item.price * item.quantity
                    ]
                );
            }

            await conn.query(
                `INSERT INTO order_addresses
                    (order_id, recipient_name, phone, address_line, barangay,
                     city, province, region, postal_code, country)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    address.recipient_name,
                    address.phone,
                    address.address_line,
                    address.barangay,
                    address.city,
                    address.province,
                    address.region,
                    address.postal_code,
                    address.country || "Philippines"
                ]
            );

            await conn.query(
                `INSERT INTO payments (order_id, payment_method, amount, status)
                 VALUES (?, ?, ?, 'PENDING')`,
                [orderId, method, total]
            );

            await notify(
                conn,
                req.userId,
                "Order placed",
                `Your order ${orderNumber} has been placed.`,
                "ORDER",
                orderId
            );

            const [shop] = await conn.query(
                "SELECT owner_id, shop_name FROM shops WHERE shop_id = ?",
                [shopId]
            );

            if (shop[0]) {
                await notify(
                    conn,
                    shop[0].owner_id,
                    "New order received",
                    `Order ${orderNumber} is waiting for your attention.`,
                    "ORDER",
                    orderId
                );
            }

            created.push({
                order_id: orderId,
                order_number: orderNumber,
                total_amount: total,
                status
            });
        }

        await conn.query(
            `DELETE ci FROM cart_items ci
             INNER JOIN carts c ON c.cart_id = ci.cart_id
             WHERE c.user_id = ? AND ci.cart_item_id IN (?)`,
            [req.userId, items.map((item) => item.cart_item_id)]
        );

        await conn.commit();

        res.status(201).json({
            message: "Order placed successfully.",
            orders: created
        });
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
});

// --------------------------------------------------
// ORDERS
// --------------------------------------------------
exports.listOrders = handler(async function listOrders(req, res) {
    const full = req.query.include === "items";

    const [orders] = await pdb.query(
        `SELECT
            o.order_id, o.order_number, o.status, o.subtotal, o.shipping_fee,
            o.discount_amount, o.total_amount, o.notes, o.placed_at,
            pay.payment_method, pay.status AS payment_status,
            sh.courier, sh.tracking_number
         FROM orders o
         LEFT JOIN payments pay ON pay.order_id = o.order_id
         LEFT JOIN shipments sh ON sh.order_id = o.order_id
         WHERE o.user_id = ?
         ORDER BY o.placed_at DESC, o.order_id DESC
         ${full ? "" : "LIMIT 5"}`,
        [req.userId]
    );

    if (!full || orders.length === 0) {
        return res.json({ orders });
    }

    const withReturns = await attachReturnInfo(pdb, orders);

    const ids = orders.map((order) => order.order_id);

    const [items] = await pdb.query(
        `SELECT
            oi.order_item_id, oi.order_id, oi.product_id, oi.product_name,
            oi.variant_name, oi.quantity, oi.unit_price, oi.subtotal,
            s.shop_name,
            EXISTS(
                SELECT 1 FROM reviews r
                WHERE r.order_item_id = oi.order_item_id AND r.user_id = ?
            ) AS reviewed
         FROM order_items oi
         INNER JOIN shops s ON s.shop_id = oi.shop_id
         WHERE oi.order_id IN (?)
         ORDER BY oi.order_item_id`,
        [req.userId, ids]
    );

    const [addresses] = await pdb.query(
        "SELECT * FROM order_addresses WHERE order_id IN (?)",
        [ids]
    );

    res.json({
        orders: withReturns.map((order) => ({
            ...order,
            shop_name:
                items.find((item) => item.order_id === order.order_id)
                    ?.shop_name || null,
            items: items
                .filter((item) => item.order_id === order.order_id)
                .map((item) => ({ ...item, reviewed: Boolean(item.reviewed) })),
            address:
                addresses.find((a) => a.order_id === order.order_id) || null
        }))
    });
});

async function lockOrder(conn, orderId, userId) {
    const [rows] = await conn.query(
        "SELECT order_id, order_number, status FROM orders WHERE order_id = ? AND user_id = ? FOR UPDATE",
        [Number(orderId), userId]
    );

    return rows[0] || null;
}

exports.cancelOrder = handler(async function cancelOrder(req, res) {
    const { orderId } = req.params;

    if (!validId(orderId)) {
        return res.status(400).json({ message: "Invalid order." });
    }

    const conn = await pdb.getConnection();

    try {
        await conn.beginTransaction();

        const order = await lockOrder(conn, orderId, req.userId);

        if (!order) {
            await conn.rollback();
            return res.status(404).json({ message: "Order not found." });
        }

        if (!["PENDING_PAYMENT", "PAID", "PROCESSING"].includes(order.status)) {
            await conn.rollback();
            return res.status(409).json({
                message: "This order can no longer be cancelled."
            });
        }

        await conn.query("UPDATE orders SET status = 'CANCELLED' WHERE order_id = ?", [
            order.order_id
        ]);
        await restoreStock(conn, order.order_id);
        await closePaymentOnCancel(conn, order.order_id);
        await notify(
            conn,
            req.userId,
            "Order cancelled",
            `Order ${order.order_number} was cancelled.`,
            "ORDER",
            order.order_id
        );

        await conn.commit();
        res.json({ message: "Order cancelled." });
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
});

// Simulated online payment: there is no real gateway connected.
exports.payOrder = handler(async function payOrder(req, res) {
    const { orderId } = req.params;

    if (!validId(orderId)) {
        return res.status(400).json({ message: "Invalid order." });
    }

    const conn = await pdb.getConnection();

    try {
        await conn.beginTransaction();

        const order = await lockOrder(conn, orderId, req.userId);

        if (!order) {
            await conn.rollback();
            return res.status(404).json({ message: "Order not found." });
        }

        if (order.status !== "PENDING_PAYMENT") {
            await conn.rollback();
            return res.status(409).json({
                message: "This order is not waiting for payment."
            });
        }

        const reference = `SIM-${Date.now().toString(36).toUpperCase()}`;

        await conn.query(
            `UPDATE payments
             SET status = 'PAID', paid_at = NOW(), transaction_reference = ?
             WHERE order_id = ?`,
            [reference, order.order_id]
        );
        await conn.query("UPDATE orders SET status = 'PAID' WHERE order_id = ?", [
            order.order_id
        ]);
        await notify(
            conn,
            req.userId,
            "Payment received",
            `Payment for order ${order.order_number} was received.`,
            "PAYMENT",
            order.order_id
        );

        await conn.commit();
        res.json({ message: "Payment successful.", transaction_reference: reference });
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
});

exports.receiveOrder = handler(async function receiveOrder(req, res) {
    const { orderId } = req.params;

    if (!validId(orderId)) {
        return res.status(400).json({ message: "Invalid order." });
    }

    const conn = await pdb.getConnection();

    try {
        await conn.beginTransaction();

        const order = await lockOrder(conn, orderId, req.userId);

        if (!order) {
            await conn.rollback();
            return res.status(404).json({ message: "Order not found." });
        }

        if (!["SHIPPED", "DELIVERED"].includes(order.status)) {
            await conn.rollback();
            return res.status(409).json({
                message: "This order has not been shipped yet."
            });
        }

        await conn.query("UPDATE orders SET status = 'COMPLETED' WHERE order_id = ?", [
            order.order_id
        ]);
        await conn.query(
            `UPDATE payments
             SET status = 'PAID', paid_at = COALESCE(paid_at, NOW())
             WHERE order_id = ? AND status IN ('PENDING', 'PROCESSING')`,
            [order.order_id]
        );
        await conn.query(
            `UPDATE shipments
             SET status = 'DELIVERED', delivered_at = COALESCE(delivered_at, NOW())
             WHERE order_id = ?`,
            [order.order_id]
        );
        await conn.query(
            `UPDATE products p
             INNER JOIN order_items oi ON oi.product_id = p.product_id
             SET p.total_sold = p.total_sold + oi.quantity
             WHERE oi.order_id = ?`,
            [order.order_id]
        );

        await conn.commit();
        res.json({ message: "Thanks! The order is now completed." });
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
});

exports.reviewItem = handler(async function reviewItem(req, res) {
    const { orderId, orderItemId } = req.params;
    const rating = Number(req.body.rating);
    const text =
        typeof req.body.review_text === "string"
            ? req.body.review_text.trim().slice(0, 2000) || null
            : null;

    if (!validId(orderId) || !validId(orderItemId)) {
        return res.status(400).json({ message: "Invalid order item." });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Choose a rating from 1 to 5." });
    }

    const [rows] = await pdb.query(
        `SELECT oi.order_item_id, oi.product_id, o.status
         FROM order_items oi
         INNER JOIN orders o ON o.order_id = oi.order_id
         WHERE oi.order_item_id = ? AND o.order_id = ? AND o.user_id = ?`,
        [Number(orderItemId), Number(orderId), req.userId]
    );

    if (rows.length === 0) {
        return res.status(404).json({ message: "Order item not found." });
    }

    if (!["DELIVERED", "COMPLETED"].includes(rows[0].status)) {
        return res.status(409).json({
            message: "You can review a product after it is delivered."
        });
    }

    const [existing] = await pdb.query(
        "SELECT review_id FROM reviews WHERE user_id = ? AND order_item_id = ?",
        [req.userId, Number(orderItemId)]
    );

    if (existing.length > 0) {
        return res.status(409).json({ message: "You already reviewed this item." });
    }

    await pdb.query(
        `INSERT INTO reviews (product_id, user_id, order_item_id, rating, review_text)
         VALUES (?, ?, ?, ?, ?)`,
        [rows[0].product_id, req.userId, Number(orderItemId), rating, text]
    );

    await pdb.query(
        `UPDATE products p
         SET p.rating = (
                SELECT ROUND(AVG(r.rating), 2) FROM reviews r
                WHERE r.product_id = p.product_id AND r.status = 'VISIBLE'
             ),
             p.total_reviews = (
                SELECT COUNT(*) FROM reviews r
                WHERE r.product_id = p.product_id AND r.status = 'VISIBLE'
             )
         WHERE p.product_id = ?`,
        [rows[0].product_id]
    );

    res.status(201).json({ message: "Thanks for your review!" });
});
