const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mysql = require("mysql2");

// A pool (instead of a single connection) so that concurrent requests and
// transactions (checkout, cancel, ...) do not interfere with each other.
const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "09320344844",
    database: process.env.DB_NAME || "shopee_db",
    waitForConnections: true,
    connectionLimit: 10
});

db.getConnection((err, connection) => {
    if (err) {
        console.error("MySQL connection failed:", err);
        return;
    }

    console.log("Connected to MySQL!");
    connection.release();
});

module.exports = db;
