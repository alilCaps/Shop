const fs = require("fs");
const path = require("path");

const { pdb } = require("./helpers");

const MIGRATION = path.join(__dirname, "..", "migrations", "005_security.sql");
const DAY = 24 * 60 * 60;

// Creates the lockout / password-reset tables if they are missing, so the app
// works even when migration 005 was not run by hand. Uses the same SQL file.
async function ensureSecuritySchema() {
    const sql = fs
        .readFileSync(MIGRATION, "utf8")
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n");

    const statements = sql
        .split(";")
        .map((statement) => statement.trim())
        .filter(Boolean);

    for (const statement of statements) {
        await pdb.query(statement);
    }
}

// Old rows are useless after a day: delete them now and then.
async function pruneSecurityTables() {
    const cutoff = Math.floor(Date.now() / 1000) - DAY;

    await pdb.query("DELETE FROM login_attempts WHERE last_failed_at < ?", [cutoff]);
    await pdb.query("DELETE FROM password_resets WHERE created_at < ?", [cutoff]);
}

function startSecurityCleanup() {
    const timer = setInterval(() => {
        pruneSecurityTables().catch((error) =>
            console.error("SECURITY CLEANUP ERROR:", error.message)
        );
    }, 60 * 60 * 1000);

    timer.unref();
}

module.exports = {
    ensureSecuritySchema,
    pruneSecurityTables,
    startSecurityCleanup
};
