// Test harness: runs the REAL controllers against an in-memory SQLite database
// instead of MySQL, so the tests need no database and no network.
// If the real "bcrypt" package is not installed, a scrypt-based stand-in is used.
const path = require("path");
const Module = require("module");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");

process.env.AUTH_SECRET = "test-secret";

// ---- bcrypt fallback ------------------------------------------------------
const originalLoad = Module._load;
Module._load = function (request, ...rest) {
    if (request === "bcrypt") {
        try {
            return originalLoad.call(this, request, ...rest);
        } catch {
            const hashSync = (pw) => {
                const salt = crypto.randomBytes(8).toString("hex");
                return `$fake$${salt}$${crypto.scryptSync(pw, salt, 16).toString("hex")}`;
            };
            const check = (pw, h) => {
                const [, , salt, digest] = h.split("$");
                return crypto.scryptSync(pw, salt, 16).toString("hex") === digest;
            };
            return {
                hashSync,
                hash: async (pw) => hashSync(pw),
                compare: async (pw, h) => check(pw, h)
            };
        }
    }
    return originalLoad.call(this, request, ...rest);
};

// ---- SQLite standing in for the MySQL pool --------------------------------
const sqlite = new DatabaseSync(":memory:");
sqlite.exec("PRAGMA foreign_keys = ON");

function run(sql, params = []) {
    const text = sql.replace(/\s+FOR UPDATE/gi, "").replace(/NOW\(\)/g, "CURRENT_TIMESTAMP");

    // Same rule as mysql2 with stringifyObjects: objects become text.
    const bound = params.map((p) =>
        p !== null && typeof p === "object" ? "[object Object]" : p
    );

    const statement = sqlite.prepare(text);

    try {
        if (/^\s*(SELECT|PRAGMA)/i.test(text)) return [statement.all(...bound)];

        const info = statement.run(...bound);
        return [{ affectedRows: Number(info.changes), insertId: Number(info.lastInsertRowid) }];
    } catch (error) {
        if (/UNIQUE|PRIMARY KEY/i.test(error.message)) error.code = "ER_DUP_ENTRY";
        throw error;
    }
}

// One connection => hand it out one caller at a time (like a row lock).
let tail = Promise.resolve();

const fakePool = {
    async query(sql, params) {
        return run(sql, params);
    },
    async getConnection() {
        let release;
        const gate = new Promise((resolve) => (release = resolve));
        const previous = tail;
        tail = previous.then(() => gate);
        await previous;

        return {
            query: async (sql, params) => run(sql, params),
            beginTransaction: async () => sqlite.exec("BEGIN"),
            commit: async () => sqlite.exec("COMMIT"),
            rollback: async () => {
                try { sqlite.exec("ROLLBACK"); } catch {}
            },
            release
        };
    }
};

const dbPath = require.resolve("../config/db");
require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: { promise: () => fakePool, query: () => {} }
};

// ---- Capture emails instead of sending them -------------------------------
const sentCodes = [];
const mailerPath = require.resolve("../utils/mailer");
require.cache[mailerPath] = {
    id: mailerPath,
    filename: mailerPath,
    loaded: true,
    exports: {
        sendResetCode: async (to, code) => {
            sentCodes.push({ to, code });
        }
    }
};

const bcrypt = require("bcrypt");

function resetDatabase() {
    sqlite.exec(`
        DROP TABLE IF EXISTS password_resets;
        DROP TABLE IF EXISTS login_attempts;
        DROP TABLE IF EXISTS notifications;
        DROP TABLE IF EXISTS users;
        DROP TABLE IF EXISTS roles;

        CREATE TABLE roles (role_id INTEGER PRIMARY KEY, role_name TEXT);
        CREATE TABLE users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE, email TEXT UNIQUE, password_hash TEXT,
            first_name TEXT, last_name TEXT, phone TEXT, profile_image TEXT,
            status TEXT, role_id INTEGER, last_login_at TEXT
        );
        CREATE TABLE notifications (
            notification_id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER,
            title TEXT, message TEXT, notification_type TEXT, reference_id INTEGER,
            is_read INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE login_attempts (
            email TEXT PRIMARY KEY, failed_count INTEGER NOT NULL DEFAULT 0,
            locked_until INTEGER, last_failed_at INTEGER
        );
        CREATE TABLE password_resets (
            reset_id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
            code_hash TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
            expires_at INTEGER NOT NULL, verified_at INTEGER, token_hash TEXT UNIQUE,
            token_expires_at INTEGER, used_at INTEGER, created_at INTEGER NOT NULL
        );
        INSERT INTO roles VALUES (1,'ADMIN'),(2,'SELLER'),(3,'CUSTOMER');
    `);
    sentCodes.length = 0;
}

async function addUser({ email, password = "Correct#123", status = "ACTIVE", role = 3, username }) {
    const [info] = await fakePool.query(
        `INSERT INTO users (username,email,password_hash,first_name,last_name,phone,status,role_id)
         VALUES (?,?,?,?,?,?,?,?)`,
        [username || email.split("@")[0], email, await bcrypt.hash(password, 4), "A", "B", "0917", status, role]
    );
    return info.insertId;
}

// Calls an Express-style handler without a web server.
async function call(handler, { body, params = {}, auth, headers = {} } = {}) {
    const res = {
        statusCode: 200, body: undefined, headers: {}, headersSent: false,
        status(code) { this.statusCode = code; return this; },
        set(k, v) { this.headers[k] = v; return this; },
        setHeader(k, v) { this.headers[k] = v; },
        json(payload) { this.body = payload; this.headersSent = true; return this; },
        send(payload) { this.body = payload; this.headersSent = true; return this; }
    };

    await handler({ body, params, auth, headers, query: {} }, res, (err) => { if (err) throw err; });
    return res;
}

module.exports = { fakePool, sqlite, resetDatabase, addUser, call, sentCodes, bcrypt };
