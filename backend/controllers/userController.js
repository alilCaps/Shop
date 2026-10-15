const db = require("../config/db");

// GET ALL USERS
const getUsers = (req, res) => {
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
            u.role_id,
            r.role_name
        FROM users u
        LEFT JOIN roles r
            ON u.role_id = r.role_id
        ORDER BY u.user_id ASC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("GET USERS ERROR:", err);

            return res.status(500).json({
                message: "Unable to retrieve users."
            });
        }

        return res.status(200).json(results);
    });
};

// GET ONE USER
const getUserById = (req, res) => {
    const userId = Number(req.params.userId);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
        return res.status(400).json({
            message: "Invalid user ID."
        });
    }

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
            u.role_id,
            r.role_name
        FROM users u
        LEFT JOIN roles r
            ON u.role_id = r.role_id
        WHERE u.user_id = ?
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("GET USER ERROR:", err);

            return res.status(500).json({
                message: "Unable to retrieve user information."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        return res.status(200).json({
            user: results[0]
        });
    });
};

// UPDATE USER PROFILE
const updateUser = (req, res) => {
    const userId = Number(req.params.userId);

    const {
        first_name,
        last_name,
        phone,
        profile_image
    } = req.body;

    if (!Number.isSafeInteger(userId) || userId <= 0) {
        return res.status(400).json({
            message: "Invalid user ID."
        });
    }

    if (
        typeof first_name !== "string" ||
        typeof last_name !== "string" ||
        typeof phone !== "string" ||
        typeof profile_image !== "string"
    ) {
        return res.status(400).json({
            message: "Invalid profile information."
        });
    }

    if (
        first_name.length > 100 ||
        last_name.length > 100 ||
        phone.length > 30 ||
        profile_image.length > 2048
    ) {
        return res.status(400).json({
            message: "One or more fields exceed the allowed length."
        });
    }

    const sql = `
        UPDATE users
        SET
            first_name = ?,
            last_name = ?,
            phone = ?,
            profile_image = ?
        WHERE user_id = ?
    `;

    const values = [
        first_name.trim() || null,
        last_name.trim() || null,
        phone.trim() || null,
        profile_image.trim() || null,
        userId
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("UPDATE PROFILE ERROR:", err);

            return res.status(500).json({
                message: "Unable to update profile."
            });
        }

        if (result.affectedRows === 0) {
            // Check whether the user exists. MySQL can report zero
            // changed rows when submitted values are unchanged.
            db.query(
                "SELECT user_id FROM users WHERE user_id = ?",
                [userId],
                (checkError, rows) => {
                    if (checkError) {
                        console.error(
                            "USER EXISTENCE CHECK ERROR:",
                            checkError
                        );

                        return res.status(500).json({
                            message: "Unable to verify the user."
                        });
                    }

                    if (rows.length === 0) {
                        return res.status(404).json({
                            message: "User not found."
                        });
                    }

                    return sendUpdatedUser(userId, res);
                }
            );

            return;
        }

        return sendUpdatedUser(userId, res);
    });
};

// HELPER: RETURN UPDATED USER
const sendUpdatedUser = (userId, res) => {
    const sql = `
        SELECT
            user_id,
            first_name,
            last_name,
            username,
            email,
            phone,
            profile_image
        FROM users
        WHERE user_id = ?
    `;

    db.query(sql, [userId], (err, rows) => {
        if (err) {
            console.error("UPDATED USER QUERY ERROR:", err);

            return res.status(500).json({
                message:
                    "Profile saved, but updated information could not be retrieved."
            });
        }

        if (rows.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        return res.status(200).json({
            message: "Profile updated successfully.",
            user: rows[0]
        });
    });
};

module.exports = {
    getUsers,
    getUserById,
    updateUser
};