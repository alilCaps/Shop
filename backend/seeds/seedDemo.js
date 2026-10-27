// Loads the demo data (backend/migrations/003_demo_data.sql) into shopee_db.
// Usage (from backend/):  npm run seed      (or: node seeds/seedDemo.js)
// Run migrations 001 and 002 first. Safe to run more than once.
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");

const DEMO_PASSWORD = "Demo@1234";
const SQL_FILE = path.join(__dirname, "..", "migrations", "003_demo_data.sql");

// INSERT IGNORE turns most errors into warnings, so check the counts after.
const EXPECTED = [
    ["users", "user_id BETWEEN 101 AND 109", 9],
    ["shops", "shop_id BETWEEN 101 AND 104", 4],
    ["addresses", "address_id BETWEEN 101 AND 107", 7],
    ["products", "product_id BETWEEN 101 AND 140", 40],
    ["product_variants", "variant_id BETWEEN 101 AND 150", 50],
    ["inventory", "inventory_id BETWEEN 101 AND 150", 50],
    ["product_images", "image_id BETWEEN 124 AND 240", 55],
    ["orders", "order_id BETWEEN 1001 AND 1016", 16],
    ["order_items", "order_item_id BETWEEN 2001 AND 2025", 25],
    ["order_addresses", "order_id BETWEEN 1001 AND 1016", 16],
    ["payments", "order_id BETWEEN 1001 AND 1016", 16],
    ["shipments", "order_id BETWEEN 1001 AND 1016", 9],
    ["reviews", "review_id BETWEEN 3001 AND 3010", 10],
    ["seller_feedback", "seller_feedback_id BETWEEN 4001 AND 4006", 6],
    ["notifications", "notification_id BETWEEN 8001 AND 8021", 21]
];

const LOGINS = [
    ["Seller", "techhub_manila@shopee.local", "TechHub Manila (active)"],
    ["Seller", "casabella_home@shopee.local", "Casa Bella Home (active)"],
    ["Seller", "urbanthreads_ph@shopee.local", "Urban Threads PH (active)"],
    ["Seller", "markgadgets@shopee.local", "Kuya Mark's Gadgets (pending approval)"],
    ["Customer", "ana_reyes@shopee.local", "has orders in many statuses"],
    ["Customer", "miguel_santos@shopee.local", ""],
    ["Customer", "carla_mendoza@shopee.local", ""],
    ["Customer", "paolo_garcia@shopee.local", "has items in the cart"],
    ["Customer", "bea_villanueva@shopee.local", ""]
];

async function main() {
    if (!fs.existsSync(SQL_FILE)) {
        throw new Error(`Cannot find ${SQL_FILE}`);
    }

    const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const sql = fs
        .readFileSync(SQL_FILE, "utf8")
        .split("__DEMO_PASSWORD_HASH__")
        .join(hash);

    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "shopee_db",
        charset: "utf8mb4",
        multipleStatements: true
    });

    try {
        console.log(`Loading demo data into ${process.env.DB_NAME || "shopee_db"}...`);
        await conn.query(sql);

        let problems = 0;
        console.log("\nRows present:");

        for (const [table, where, expected] of EXPECTED) {
            const [rows] = await conn.query(
                `SELECT COUNT(*) AS total FROM \`${table}\` WHERE ${where}`
            );
            const total = Number(rows[0].total);
            const ok = total === expected;

            if (!ok) problems += 1;
            console.log(`  ${ok ? "ok " : "!! "} ${table.padEnd(18)} ${total}/${expected}`);
        }

        if (problems > 0) {
            console.warn(
                "\nSome demo rows are missing. Make sure migrations 001 and 002 were run and that " +
                    "categories 1-10 and 21-24 exist (a missing parent row makes INSERT IGNORE skip the child)."
            );
        }

        console.log(`\nDemo logins (password for all: ${DEMO_PASSWORD})`);
        for (const [role, email, note] of LOGINS) {
            console.log(`  ${role.padEnd(9)} ${email}${note ? `  - ${note}` : ""}`);
        }
        console.log("\nAdmin: use your existing admin account (Jannah).");

        if (problems > 0) process.exitCode = 1;
    } finally {
        await conn.end();
    }
}

main().catch((error) => {
    console.error("\nSeeding failed:", error.sqlMessage || error.message);
    process.exit(1);
});
