const express = require("express");
const cors = require("cors");
const db = require("./db");
const bcrypt = require("bcrypt");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Backend is running!");
});

app.get("/users", (req, res) => {
    const sql = "SELECT * FROM users";

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json(results);
    });
});


app.get("/api/categories", (req, res) => {
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
                message: "Unable to load categories.",
                error: err.message
            });
        }

        res.status(200).json(results);
    });
});


app.get("/api/products", (req, res) => {
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
                message: "Unable to load products.",
                error: err.message
            });
        }

        res.status(200).json(results);
    });
});

app.get("/users/:userId", (req, res) => {

    const { userId } = req.params;

    console.log("REQUESTED USER ID:", userId);

    const sql = `
        SELECT
            u.user_id,
            u.username,
            u.email,
            u.first_name,
            u.last_name,
            u.phone,
            u.profile_image,
            u.status,
            r.role_id,
            r.role_name
        FROM users u
        LEFT JOIN roles r
            ON u.role_id = r.role_id
        WHERE u.user_id = ?
    `;

    db.query(sql, [userId], (err, results) => {

        if (err) {

            console.error(
                "MYSQL ERROR:",
                err
            );

            return res.status(500).json({
                message: "Database error",
                error: err.message
            });

        }


        if (results.length === 0) {

            return res.status(404).json({
                message: "User not found"
            });

        }


        const user = results[0];


        return res.status(200).json({

            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone,
                profile_image: user.profile_image,
                status: user.status,
                role_id: user.role_id,
                role_name: user.role_name
            }

        });

    });

});


app.post("/login", (req, res) => {
    console.log("=================================");
    console.log("LOGIN REQUEST RECEIVED");
    console.log("EMAIL:", req.body.email);
    console.log("=================================");

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email or password is missing"
        });
    }

    const sql = `
        SELECT
            u.user_id,
            u.username,
            u.email,
            u.password_hash,
            u.first_name,
            u.last_name,
            u.phone,
            u.profile_image,
            u.status,
            r.role_id,
            r.role_name
        FROM users u
        INNER JOIN roles r
            ON u.role_id = r.role_id
        WHERE u.email = ?`;

    console.log("Running login query...");

    db.query(sql, [email], async (err, results) => {
        if (err) {
            console.error("MYSQL ERROR:", err);

            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        console.log("QUERY RESULTS:", results);

        if (results.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = results[0];

        if (user.status !== "ACTIVE") {
            return res.status(403).json({
                message: "Account is not active"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        console.log("PASSWORD VERIFIED");
        console.log("USER ROLE:", user.role_name);

        return res.status(200).json({
            message: "Login successful",
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone,
                profile_image: user.profile_image,
                status: user.status,
                role_id: user.role_id,
                role_name: user.role_name
            }
        });
    });
});

app.post("/signup", async (req, res) => {

    console.log("=================================");
    console.log("SIGNUP REQUEST RECEIVED");
    console.log("BODY:", req.body);
    console.log("=================================");

    const {
        phone,
        username,
        email,
        password
    } = req.body;


    // Check required fields
    if (!phone || !username || !email || !password) {

        return res.status(400).json({
            message: "All fields are required."
        });

    }


    try {

        // Check if username or email already exists
        const checkSql = `
            SELECT user_id
            FROM users
            WHERE username = ?
            OR email = ?
        `;

        db.query(
            checkSql,
            [username, email],
            async (err, results) => {

                if (err) {

                    console.error("MYSQL ERROR:", err);

                    return res.status(500).json({
                        message: "Database error.",
                        error: err.message
                    });

                }


                if (results.length > 0) {

                    return res.status(409).json({
                        message: "Username or email is already registered."
                    });

                }


                // Hash password
                const hashedPassword = await bcrypt.hash(password, 10);

                console.log("Password successfully hashed.");


                // Find Customer role
                const roleSql = `
                    SELECT role_id
                    FROM roles
                    WHERE LOWER(role_name) = 'customer'
                    LIMIT 1
                `;

                db.query(roleSql, (roleErr, roleResults) => {

                    if (roleErr) {

                        console.error("ROLE MYSQL ERROR:", roleErr);

                        return res.status(500).json({
                            message: "Unable to find customer role.",
                            error: roleErr.message
                        });

                    }


                    if (roleResults.length === 0) {

                        return res.status(500).json({
                            message: "Customer role does not exist."
                        });

                    }


                    const customerRoleId = roleResults[0].role_id;


                    // Insert new user
                    const insertSql = `
                        INSERT INTO users (
                            username,
                            email,
                            password_hash,
                            first_name,
                            last_name,
                            phone,
                            status,
                            role_id
                        )
                        VALUES (?, ?, ?, '', '', ?, 'ACTIVE', ?)`;


                    db.query(
                        insertSql,
                        [
                            username,
                            email,
                            hashedPassword,
                            phone,
                            customerRoleId
                        ],
                        (insertErr, result) => {

                            if (insertErr) {

                                console.error(
                                    "INSERT MYSQL ERROR:",
                                    insertErr
                                );

                                return res.status(500).json({
                                    message: "Unable to create account.",
                                    error: insertErr.message
                                });

                            }


                            console.log(
                                "NEW USER CREATED:",
                                result.insertId
                            );


                            return res.status(201).json({

                                message: "Account created successfully.",

                                user_id: result.insertId

                            });

                        }
                    );

                });

            }
        );

    } catch (error) {

        console.error("SIGNUP ERROR:", error);

        return res.status(500).json({
            message: "Server error."
        });

    }

});


/* CUSTOMER DASHBOARD: ORDER STATISTICS */
app.get("/api/customer/:userId/dashboard-stats", (req, res) => {
    const userId = req.params.userId;

    if (!/^\d+$/.test(userId)) {
        return res.status(400).json({
            message: "Invalid user ID."
        });
    }

    const sql = `
        SELECT
            COALESCE(SUM(
                CASE
                    WHEN status = 'SHIPPED' THEN 1
                    ELSE 0
                END
            ), 0) AS to_receive,

            COALESCE(SUM(
                CASE
                    WHEN status = 'DELIVERED' THEN 1
                    ELSE 0
                END
            ), 0) AS to_review,

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

        res.json(results[0]);
    });
});

app.get("/api/customer/:userId/orders/on-the-way", (req, res) => {
    const userId = req.params.userId;

    if (!/^\d+$/.test(userId)) {
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

        res.json({
            order: results.length > 0 ? results[0] : null
        });
    });
});


/* CUSTOMER DASHBOARD: RECENT ORDERS */
app.get("/api/customer/:userId/orders", (req, res) => {
    const userId = req.params.userId;

    if (!/^\d+$/.test(userId)) {
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

        res.json(results);
    });
});


app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});

