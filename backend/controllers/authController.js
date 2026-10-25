const db = require("../config/db");
const bcrypt = require("bcrypt");
const { createToken } = require("../utils/auth");

// LOGIN
const login = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email or password is missing."
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
        WHERE u.email = ?
    `;

    db.query(sql, [email], async (err, results) => {
        if (err) {
            console.error("LOGIN MYSQL ERROR:", err);

            return res.status(500).json({
                message: "Database error."
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const user = results[0];

        if (user.status !== "ACTIVE") {
            return res.status(403).json({
                message: "Account is not active."
            });
        }

        try {
            const passwordMatch = await bcrypt.compare(
                password,
                user.password_hash
            );

            if (!passwordMatch) {
                return res.status(401).json({
                    message: "Invalid email or password."
                });
            }

            db.query(
                "UPDATE users SET last_login_at = NOW() WHERE user_id = ?",
                [user.user_id],
                () => {}
            );

            return res.status(200).json({
                message: "Login successful",
                user: {
                    token: createToken(user),
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
        } catch (error) {
            console.error("PASSWORD VERIFICATION ERROR:", error);

            return res.status(500).json({
                message: "Unable to verify password."
            });
        }
    });
};

// SIGNUP
const signup = async (req, res) => {
    const { phone, username, email, password } = req.body;

    if (!phone || !username || !email || !password) {
        return res.status(400).json({
            message: "All fields are required."
        });
    }

    try {
        const checkSql = `
            SELECT user_id
            FROM users
            WHERE username = ? OR email = ?
        `;

        db.query(
            checkSql,
            [username, email],
            async (err, results) => {
                if (err) {
                    console.error("SIGNUP CHECK ERROR:", err);

                    return res.status(500).json({
                        message: "Database error."
                    });
                }

                if (results.length > 0) {
                    return res.status(409).json({
                        message:
                            "Username or email is already registered."
                    });
                }

                try {
                    const hashedPassword = await bcrypt.hash(
                        password,
                        10
                    );

                    // Only customers and sellers can self-register.
                    const wantedRole =
                        req.body.account_type === "seller"
                            ? "seller"
                            : "customer";

                    const roleSql = `
                        SELECT role_id
                        FROM roles
                        WHERE LOWER(role_name) = ?
                        LIMIT 1
                    `;

                    db.query(roleSql, [wantedRole], (roleErr, roleResults) => {
                        if (roleErr) {
                            console.error("ROLE QUERY ERROR:", roleErr);

                            return res.status(500).json({
                                message: "Unable to find customer role."
                            });
                        }

                        if (roleResults.length === 0) {
                            return res.status(500).json({
                                message: "Customer role does not exist."
                            });
                        }

                        const customerRoleId =
                            roleResults[0].role_id;

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
                            VALUES (?, ?, ?, '', '', ?, 'ACTIVE', ?)
                        `;

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
                                        "SIGNUP INSERT ERROR:",
                                        insertErr
                                    );

                                    return res.status(500).json({
                                        message: "Unable to create account."
                                    });
                                }

                                return res.status(201).json({
                                    message:
                                        "Account created successfully.",
                                    user_id: result.insertId
                                });
                            }
                        );
                    });
                } catch (hashError) {
                    console.error("PASSWORD HASH ERROR:", hashError);

                    return res.status(500).json({
                        message: "Unable to process registration."
                    });
                }
            }
        );
    } catch (error) {
        console.error("SIGNUP ERROR:", error);

        return res.status(500).json({
            message: "Server error."
        });
    }
};

module.exports = {
    login,
    signup
};