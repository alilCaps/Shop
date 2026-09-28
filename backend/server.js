const express = require("express");
const cors = require("cors");
const db = require("./db");

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


app.post("/login", (req, res) => {
    console.log("=================================");
    console.log("LOGIN REQUEST RECEIVED");
    console.log("BODY:", req.body);
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
        AND u.password_hash = ?
    `;

    console.log("Running login query...");

    db.query(sql, [email, password], (err, results) => {
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

app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});

