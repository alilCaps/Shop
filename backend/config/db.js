const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mysql = require("mysql2");

// Connection details come only from backend/.env (never commit that file).
const required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
    console.error(`Missing database settings in backend/.env: ${missing.join(", ")}`);
}

// A pool (instead of a single connection) so that concurrent requests and
// transactions (checkout, cancel, ...) do not interfere with each other.
const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // Hosted databases such as Aiven require TLS: set DB_SSL=true.
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
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
