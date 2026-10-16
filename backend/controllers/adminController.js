
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
        query(
          `SELECT COUNT(*) AS total
           FROM users u
           INNER JOIN roles r ON r.role_id = u.role_id
           WHERE UPPER(r.role_name) = 'SELLER'`
        ),
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

  if (!validId(userId)) {
    return res.status(400).json({ message: "Invalid user ID." });
  }

  const body = { ...req.body };

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
    const result = await query(
      `UPDATE users SET ${fields.join(", ")} WHERE user_id = ?`,
      [...values, Number(userId)]
    );

    const check = await query(
      "SELECT user_id FROM users WHERE user_id = ?",
      [Number(userId)]
    );

    if (check.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

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
    await query(
      `UPDATE shops SET ${fields.join(", ")} WHERE shop_id = ?`,
      [...values, Number(shopId)]
    );

    const rows = await query(
      "SELECT shop_id FROM shops WHERE shop_id = ?",
      [Number(shopId)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Shop not found." });
    }

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
    await query(
      `UPDATE categories SET ${fields.join(", ")} WHERE category_id = ?`,
      [...values, Number(categoryId)]
    );

    const rows = await query(
      "SELECT category_id FROM categories WHERE category_id = ?",
      [Number(categoryId)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Category not found." });
    }

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
    await query(
      `UPDATE products SET ${fields.join(", ")} WHERE product_id = ?`,
      [...values, Number(productId)]
    );

    const rows = await query(
      "SELECT product_id FROM products WHERE product_id = ?",
      [Number(productId)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Product not found." });
    }

    return res.json({ message: "Product updated successfully." });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};
