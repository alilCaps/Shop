const db = require("../config/db");

const USER_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED", "BANNED"];
const SHOP_STATUSES = ["PENDING", "ACTIVE", "SUSPENDED", "CLOSED"];
const CATEGORY_STATUSES = ["ACTIVE", "INACTIVE"];
const PRODUCT_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "OUT_OF_STOCK",
  "INACTIVE",
  "BANNED",
];

async function query(sql, values = []) {
  const [rows] = await db.promise().query(sql, values);
  return rows;
}

function sendDatabaseError(res, error) {
  console.error("Admin controller error:", error.message);

  return res.status(500).json({
    message: "Unable to process the request.",
  });
}

function validId(value) {
  return /^\d+$/.test(String(value)) && Number(value) > 0;
}

function normalizeStatus(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : value;
}

function buildUpdate(fields, body, allowedFields) {
  const values = [];

  for (const [key, value] of Object.entries(body)) {
    if (!allowedFields.includes(key) || value === undefined) {
      continue;
    }

    fields.push(`${key} = ?`);
    values.push(value);
  }

  return values;
}

// --------------------------------------------------
// ADMIN OVERVIEW
// GET /api/admin/overview
// --------------------------------------------------
exports.getAdminOverview = async (req, res) => {
  try {
    const [users, sellers, shops, categories, products, orders] =
      await Promise.all([
        query("SELECT COUNT(*) AS total FROM users"),
        query(`
          SELECT COUNT(*) AS total
          FROM users u
          INNER JOIN roles r ON r.role_id = u.role_id
          WHERE UPPER(r.role_name) = 'SELLER'
        `),
        query("SELECT COUNT(*) AS total FROM shops"),
        query("SELECT COUNT(*) AS total FROM categories"),
        query("SELECT COUNT(*) AS total FROM products"),
        query("SELECT COUNT(*) AS total FROM orders"),
      ]);

    return res.json({
      data: {
        users: users[0].total,
        sellers: sellers[0].total,
        shops: shops[0].total,
        categories: categories[0].total,
        products: products[0].total,
        orders: orders[0].total,
      },
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

// --------------------------------------------------
// USERS
// GET /api/admin/users
// PUT /api/admin/users/:userId
// --------------------------------------------------
exports.getUsers = async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        u.user_id,
        u.first_name,
        u.last_name,
        CONCAT_WS(' ', u.first_name, u.last_name) AS full_name,
        u.username,
        u.email,
        u.phone,
        u.status,
        u.email_verified,
        u.phone_verified,
        u.last_login_at,
        u.created_at,
        r.role_name
      FROM users u
      LEFT JOIN roles r ON r.role_id = u.role_id
      ORDER BY u.user_id DESC
    `);

    return res.json({ data: rows });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const body = { ...req.body };

  if (!validId(userId)) {
    return res.status(400).json({ message: "Invalid user ID." });
  }

  if (body.status !== undefined) {
    body.status = normalizeStatus(body.status);

    if (!USER_STATUSES.includes(body.status)) {
      return res.status(400).json({
        message: `Status must be one of: ${USER_STATUSES.join(", ")}.`,
      });
    }
  }

  for (const field of ["first_name", "last_name"]) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== "string" || !body[field].trim()) {
        return res.status(400).json({
          message: `${field} cannot be empty.`,
        });
      }

      body[field] = body[field].trim();
    }
  }

  const fields = [];
  const values = buildUpdate(fields, body, [
    "first_name",
    "last_name",
    "status",
  ]);

  if (fields.length === 0) {
    return res.status(400).json({
      message: "Provide at least one valid field to update.",
    });
  }

  try {
    const existing = await query(
      "SELECT user_id FROM users WHERE user_id = ?",
      [Number(userId)]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    await query(
      `UPDATE users SET ${fields.join(", ")} WHERE user_id = ?`,
      [...values, Number(userId)]
    );

    return res.json({ message: "User updated successfully." });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

// --------------------------------------------------
// SELLERS
// GET /api/admin/sellers
// --------------------------------------------------
exports.getSellers = async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        u.user_id,
        u.first_name,
        u.last_name,
        CONCAT_WS(' ', u.first_name, u.last_name) AS full_name,
        u.username,
        u.email,
        u.status,
        s.shop_id,
        s.shop_name,
        s.status AS shop_status
      FROM users u
      INNER JOIN roles r ON r.role_id = u.role_id
      LEFT JOIN shops s ON s.owner_id = u.user_id
      WHERE UPPER(r.role_name) = 'SELLER'
      ORDER BY u.user_id DESC
    `);

    return res.json({ data: rows });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

// --------------------------------------------------
// SHOPS
// GET /api/admin/shops
// PUT /api/admin/shops/:shopId
// --------------------------------------------------
exports.getShops = async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        s.shop_id,
        s.shop_name,
        s.shop_description,
        s.contact_email,
        s.contact_phone,
        s.shop_address,
        s.status,
        s.rating,
        s.total_reviews,
        s.created_at,
        u.user_id AS owner_id,
        CONCAT_WS(' ', u.first_name, u.last_name) AS seller_name,
        u.email AS seller_email
      FROM shops s
      INNER JOIN users u ON u.user_id = s.owner_id
      ORDER BY s.shop_id DESC
    `);

    return res.json({ data: rows });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

exports.updateShop = async (req, res) => {
  const { shopId } = req.params;
  const body = { ...req.body };

  if (!validId(shopId)) {
    return res.status(400).json({ message: "Invalid shop ID." });
  }

  if (body.status !== undefined) {
    body.status = normalizeStatus(body.status);

    if (!SHOP_STATUSES.includes(body.status)) {
      return res.status(400).json({
        message: `Status must be one of: ${SHOP_STATUSES.join(", ")}.`,
      });
    }
  }

  const fields = [];
  const values = buildUpdate(fields, body, [
    "shop_name",
    "shop_description",
    "contact_email",
    "contact_phone",
    "shop_address",
    "status",
  ]);

  if (fields.length === 0) {
    return res.status(400).json({
      message: "Provide at least one valid field to update.",
    });
  }

  try {
    const existing = await query(
      "SELECT shop_id FROM shops WHERE shop_id = ?",
      [Number(shopId)]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Shop not found." });
    }

    await query(
      `UPDATE shops SET ${fields.join(", ")} WHERE shop_id = ?`,
      [...values, Number(shopId)]
    );

    return res.json({ message: "Shop updated successfully." });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

// --------------------------------------------------
// CATEGORIES
// GET /api/admin/categories
// POST /api/admin/categories
// PUT /api/admin/categories/:categoryId
// --------------------------------------------------
exports.getCategories = async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        c.category_id,
        c.parent_category_id,
        c.category_name,
        c.description,
        c.image_url,
        c.status,
        c.created_at,
        parent.category_name AS parent_category_name
      FROM categories c
      LEFT JOIN categories parent
        ON parent.category_id = c.parent_category_id
      ORDER BY c.category_id DESC
    `);

    return res.json({ data: rows });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

exports.createCategory = async (req, res) => {
  const {
    category_name,
    description = null,
    image_url = null,
    parent_category_id = null,
  } = req.body;

  if (
    typeof category_name !== "string" ||
    !category_name.trim()
  ) {
    return res.status(400).json({
      message: "Category name is required.",
    });
  }

  if (
    parent_category_id !== null &&
    parent_category_id !== "" &&
    !validId(parent_category_id)
  ) {
    return res.status(400).json({
      message: "Invalid parent category ID.",
    });
  }

  try {
    if (parent_category_id) {
      const parent = await query(
        "SELECT category_id FROM categories WHERE category_id = ?",
        [Number(parent_category_id)]
      );

      if (parent.length === 0) {
        return res.status(400).json({
          message: "Parent category does not exist.",
        });
      }
    }

    const result = await query(
      `INSERT INTO categories
        (category_name, description, image_url, parent_category_id, status)
       VALUES (?, ?, ?, ?, 'ACTIVE')`,
      [
        category_name.trim(),
        description || null,
        image_url || null,
        parent_category_id ? Number(parent_category_id) : null,
      ]
    );

    return res.status(201).json({
      message: "Category created successfully.",
      category_id: result.insertId,
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

exports.updateCategory = async (req, res) => {
  const { categoryId } = req.params;
  const body = { ...req.body };

  if (!validId(categoryId)) {
    return res.status(400).json({
      message: "Invalid category ID.",
    });
  }

  if (body.category_name !== undefined) {
    if (
      typeof body.category_name !== "string" ||
      !body.category_name.trim()
    ) {
      return res.status(400).json({
        message: "Category name cannot be empty.",
      });
    }

    body.category_name = body.category_name.trim();
  }

  if (body.status !== undefined) {
    body.status = normalizeStatus(body.status);

    if (!CATEGORY_STATUSES.includes(body.status)) {
      return res.status(400).json({
        message: "Category status must be ACTIVE or INACTIVE.",
      });
    }
  }

  if (
    body.parent_category_id !== undefined &&
    body.parent_category_id !== null &&
    body.parent_category_id !== "" &&
    !validId(body.parent_category_id)
  ) {
    return res.status(400).json({
      message: "Invalid parent category ID.",
    });
  }

  const fields = [];
  const values = buildUpdate(fields, body, [
    "category_name",
    "description",
    "image_url",
    "parent_category_id",
    "status",
  ]);

  if (fields.length === 0) {
    return res.status(400).json({
      message: "Provide at least one valid field to update.",
    });
  }

  try {
    const existing = await query(
      "SELECT category_id FROM categories WHERE category_id = ?",
      [Number(categoryId)]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Category not found." });
    }

    if (
      body.parent_category_id &&
      Number(body.parent_category_id) === Number(categoryId)
    ) {
      return res.status(400).json({
        message: "A category cannot be its own parent.",
      });
    }

    if (body.parent_category_id) {
      const parent = await query(
        "SELECT category_id FROM categories WHERE category_id = ?",
        [Number(body.parent_category_id)]
      );

      if (parent.length === 0) {
        return res.status(400).json({
          message: "Parent category does not exist.",
        });
      }
    }

    await query(
      `UPDATE categories SET ${fields.join(", ")} WHERE category_id = ?`,
      [...values, Number(categoryId)]
    );

    return res.json({ message: "Category updated successfully." });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

// --------------------------------------------------
// PRODUCTS
// GET /api/admin/products
// PUT /api/admin/products/:productId
// --------------------------------------------------
exports.getProducts = async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        p.product_id,
        p.product_name,
        p.description,
        p.brand,
        p.base_price AS price,
        p.status,
        p.rating,
        p.total_reviews,
        p.total_sold,
        p.created_at,
        s.shop_id,
        s.shop_name,
        c.category_id,
        c.category_name
      FROM products p
      INNER JOIN shops s ON s.shop_id = p.shop_id
      INNER JOIN categories c ON c.category_id = p.category_id
      ORDER BY p.product_id DESC
    `);

    return res.json({ data: rows });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

exports.updateProduct = async (req, res) => {
  const { productId } = req.params;
  const body = { ...req.body };

  if (!validId(productId)) {
    return res.status(400).json({ message: "Invalid product ID." });
  }

  if (body.status !== undefined) {
    body.status = normalizeStatus(body.status);

    if (!PRODUCT_STATUSES.includes(body.status)) {
      return res.status(400).json({
        message: `Product status must be one of: ${PRODUCT_STATUSES.join(", ")}.`,
      });
    }
  }

  if (body.product_name !== undefined) {
    if (
      typeof body.product_name !== "string" ||
      !body.product_name.trim()
    ) {
      return res.status(400).json({
        message: "Product name cannot be empty.",
      });
    }

    body.product_name = body.product_name.trim();
  }

  if (
    body.base_price !== undefined &&
    (!Number.isFinite(Number(body.base_price)) ||
      Number(body.base_price) < 0)
  ) {
    return res.status(400).json({
      message: "Base price must be a non-negative number.",
    });
  }

  if (
    body.category_id !== undefined &&
    !validId(body.category_id)
  ) {
    return res.status(400).json({
      message: "Invalid category ID.",
    });
  }

  const fields = [];
  const values = buildUpdate(fields, body, [
    "product_name",
    "description",
    "brand",
    "base_price",
    "category_id",
    "status",
  ]);

  if (fields.length === 0) {
    return res.status(400).json({
      message: "Provide at least one valid field to update.",
    });
  }

  try {
    const existing = await query(
      "SELECT product_id FROM products WHERE product_id = ?",
      [Number(productId)]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Product not found." });
    }

    if (body.category_id !== undefined) {
      const category = await query(
        "SELECT category_id FROM categories WHERE category_id = ?",
        [Number(body.category_id)]
      );

      if (category.length === 0) {
        return res.status(400).json({
          message: "Category does not exist.",
        });
      }
    }

    await query(
      `UPDATE products SET ${fields.join(", ")} WHERE product_id = ?`,
      [...values, Number(productId)]
    );

    return res.json({ message: "Product updated successfully." });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

// --------------------------------------------------
// ORDERS
// GET /api/admin/orders
// PUT /api/admin/orders/:orderId
// --------------------------------------------------
const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
];

exports.getOrders = async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        o.order_id,
        o.order_number,
        o.user_id,
        CONCAT_WS(' ', u.first_name, u.last_name) AS customer_name,
        o.subtotal,
        o.shipping_fee,
        o.discount_amount,
        o.total_amount,
        o.status,
        o.placed_at,
        COUNT(oi.order_item_id) AS item_count
      FROM orders o
      INNER JOIN users u ON u.user_id = o.user_id
      LEFT JOIN order_items oi ON oi.order_id = o.order_id
      GROUP BY
        o.order_id, o.order_number, o.user_id,
        u.first_name, u.last_name, o.subtotal,
        o.shipping_fee, o.discount_amount, o.total_amount,
        o.status, o.placed_at
      ORDER BY o.placed_at DESC
    `);

    return res.json({ data: rows });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

exports.updateOrder = async (req, res) => {
  const { orderId } = req.params;
  const status = normalizeStatus(req.body.status);

  if (!validId(orderId)) {
    return res.status(400).json({ message: "Invalid order ID." });
  }

  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({
      message: `Status must be one of: ${ORDER_STATUSES.join(", ")}.`,
    });
  }

  try {
    const rows = await query(
      "SELECT order_id, status FROM orders WHERE order_id = ?",
      [Number(orderId)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Order not found." });
    }

    const currentStatus = rows[0].status;

    const allowedTransitions = {
      PENDING_PAYMENT: ["PAID", "CANCELLED"],
      PAID: ["PROCESSING", "CANCELLED", "REFUNDED"],
      PROCESSING: ["SHIPPED", "CANCELLED", "REFUNDED"],
      SHIPPED: ["DELIVERED", "REFUNDED"],
      DELIVERED: ["COMPLETED", "REFUNDED"],
      COMPLETED: ["REFUNDED"],
      CANCELLED: [],
      REFUNDED: [],
    };

    if (
      currentStatus !== status &&
      !allowedTransitions[currentStatus]?.includes(status)
    ) {
      return res.status(409).json({
        message: `Order cannot move from ${currentStatus} to ${status}.`,
      });
    }

    await query(
      "UPDATE orders SET status = ? WHERE order_id = ?",
      [status, Number(orderId)]
    );

    return res.json({ message: "Order status updated successfully." });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

// --------------------------------------------------
// REVIEWS
// GET /api/admin/reviews
// PUT /api/admin/reviews/:reviewId
// --------------------------------------------------
const REVIEW_STATUSES = ["VISIBLE", "HIDDEN", "REMOVED"];

exports.getReviews = async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        r.review_id,
        r.product_id,
        p.product_name,
        r.user_id,
        CONCAT_WS(' ', u.first_name, u.last_name) AS customer_name,
        r.order_item_id,
        r.rating,
        r.review_text,
        r.status,
        r.created_at
      FROM reviews r
      INNER JOIN products p ON p.product_id = r.product_id
      INNER JOIN users u ON u.user_id = r.user_id
      ORDER BY r.created_at DESC
    `);

    return res.json({ data: rows });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

exports.updateReview = async (req, res) => {
  const { reviewId } = req.params;
  const status = normalizeStatus(req.body.status);

  if (!validId(reviewId)) {
    return res.status(400).json({ message: "Invalid review ID." });
  }

  if (!REVIEW_STATUSES.includes(status)) {
    return res.status(400).json({
      message: `Status must be one of: ${REVIEW_STATUSES.join(", ")}.`,
    });
  }

  try {
    const exists = await query(
      "SELECT review_id FROM reviews WHERE review_id = ?",
      [Number(reviewId)]
    );

    if (exists.length === 0) {
      return res.status(404).json({ message: "Review not found." });
    }

    await query(
      "UPDATE reviews SET status = ? WHERE review_id = ?",
      [status, Number(reviewId)]
    );

    return res.json({ message: "Review status updated successfully." });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

// --------------------------------------------------
// NOTIFICATIONS
// GET /api/admin/notifications
// PUT /api/admin/notifications/:notificationId
// --------------------------------------------------
exports.getNotifications = async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        n.notification_id,
        n.user_id,
        CONCAT_WS(' ', u.first_name, u.last_name) AS user_name,
        n.title,
        n.message,
        n.notification_type,
        n.reference_id,
        n.is_read,
        n.created_at
      FROM notifications n
      INNER JOIN users u ON u.user_id = n.user_id
      ORDER BY n.created_at DESC
    `);

    return res.json({ data: rows });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

exports.updateNotification = async (req, res) => {
  const { notificationId } = req.params;
  const { is_read } = req.body;

  if (!validId(notificationId)) {
    return res.status(400).json({
      message: "Invalid notification ID.",
    });
  }

  if (![true, false, 0, 1].includes(is_read)) {
    return res.status(400).json({
      message: "is_read must be true, false, 0, or 1.",
    });
  }

  try {
    const exists = await query(
      "SELECT notification_id FROM notifications WHERE notification_id = ?",
      [Number(notificationId)]
    );

    if (exists.length === 0) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    await query(
      "UPDATE notifications SET is_read = ? WHERE notification_id = ?",
      [Number(Boolean(is_read)), Number(notificationId)]
    );

    return res.json({ message: "Notification updated successfully." });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

// --------------------------------------------------
// ACTIVITY LOGS
// GET /api/admin/activity-logs
// Read-only
// --------------------------------------------------
exports.getActivityLogs = async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        a.audit_id,
        a.user_id,
        CONCAT_WS(' ', u.first_name, u.last_name) AS user_name,
        a.action,
        a.table_name,
        a.record_id,
        a.old_value,
        a.new_value,
        a.ip_address,
        a.created_at
      FROM audit_logs a
      LEFT JOIN users u ON u.user_id = a.user_id
      ORDER BY a.created_at DESC
      LIMIT 500
    `);

    return res.json({ data: rows });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

// --------------------------------------------------
// REPORTS
// GET /api/admin/reports
// --------------------------------------------------
exports.getReports = async (req, res) => {
  try {
    const [ordersByStatus, productsByStatus, usersByStatus, sales] =
      await Promise.all([
        query(`
          SELECT status, COUNT(*) AS total
          FROM orders
          GROUP BY status
          ORDER BY status
        `),
        query(`
          SELECT status, COUNT(*) AS total
          FROM products
          GROUP BY status
          ORDER BY status
        `),
        query(`
          SELECT status, COUNT(*) AS total
          FROM users
          GROUP BY status
          ORDER BY status
        `),
        query(`
          SELECT
            COUNT(*) AS order_count,
            COALESCE(SUM(total_amount), 0) AS order_value
          FROM orders
          WHERE status IN (
            'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'
          )
        `),
      ]);

    return res.json({
      data: {
        orders_by_status: ordersByStatus,
        products_by_status: productsByStatus,
        users_by_status: usersByStatus,
        sales_summary: sales[0],
      },
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

// --------------------------------------------------
// TRANSACTIONS
// GET /api/admin/transactions
// PUT /api/admin/transactions/:paymentId
// --------------------------------------------------

const PAYMENT_STATUSES = [
  "PENDING",
  "PROCESSING",
  "PAID",
  "FAILED",
  "REFUNDED",
];

const PAYMENT_METHODS = [
  "CASH_ON_DELIVERY",
  "GCASH",
  "MAYA",
  "BANK_TRANSFER",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "OTHER",
];

exports.getTransactions = async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        p.payment_id,
        p.order_id,
        o.order_number,
        o.user_id,
        CONCAT_WS(' ', u.first_name, u.last_name) AS customer_name,
        p.payment_method,
        p.transaction_reference,
        p.amount,
        p.status,
        p.paid_at,
        p.created_at
      FROM payments p
      INNER JOIN orders o ON o.order_id = p.order_id
      INNER JOIN users u ON u.user_id = o.user_id
      ORDER BY p.created_at DESC
    `);

    return res.json({ data: rows });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

exports.updateTransaction = async (req, res) => {
  const { paymentId } = req.params;
  const body = req.body;

  if (!validId(paymentId)) {
    return res.status(400).json({
      message: "Invalid payment ID.",
    });
  }

  const updates = {};

  if (body.status !== undefined) {
    const status = normalizeStatus(body.status);

    if (!PAYMENT_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Status must be one of: ${PAYMENT_STATUSES.join(", ")}.`,
      });
    }

    updates.status = status;
  }

  if (body.payment_method !== undefined) {
    const method = normalizeStatus(body.payment_method);

    if (!PAYMENT_METHODS.includes(method)) {
      return res.status(400).json({
        message: `Payment method must be one of: ${PAYMENT_METHODS.join(", ")}.`,
      });
    }

    updates.payment_method = method;
  }

  if (body.transaction_reference !== undefined) {
    if (
      body.transaction_reference !== null &&
      typeof body.transaction_reference !== "string"
    ) {
      return res.status(400).json({
        message: "Transaction reference must be a string or null.",
      });
    }

    updates.transaction_reference =
      body.transaction_reference?.trim() || null;
  }

  const fields = [];
  const values = buildUpdate(fields, updates, [
    "status",
    "payment_method",
    "transaction_reference",
  ]);

  if (fields.length === 0) {
    return res.status(400).json({
      message: "Provide at least one valid field to update.",
    });
  }

  try {
    const existing = await query(
      "SELECT payment_id, status FROM payments WHERE payment_id = ?",
      [Number(paymentId)]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        message: "Transaction not found.",
      });
    }

    if (updates.status === "PAID") {
      fields.push("paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP)");
    }

    await query(
      `UPDATE payments SET ${fields.join(", ")} WHERE payment_id = ?`,
      [...values, Number(paymentId)]
    );

    return res.json({
      message: "Transaction updated successfully.",
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};