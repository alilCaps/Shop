const { pdb } = require("./helpers");

const MAX_ATTEMPTS = 3;
const LOCK_SECONDS = 15 * 60;

const now = () => Math.floor(Date.now() / 1000);

// Same email in any letter case / with stray spaces counts as one account.
// Returns "" for anything that is not a usable email string.
function normalizeEmail(value) {
    if (typeof value !== "string") return "";

    const email = value.trim().toLowerCase();

    return email.length > 0 && email.length <= 100 ? email : "";
}

function minutesLeft(seconds) {
    return Math.max(1, Math.ceil(seconds / 60));
}

// Is this email locked right now? { locked, retryAfter (seconds) }
async function getLock(email) {
    const [rows] = await pdb.query(
        "SELECT locked_until FROM login_attempts WHERE email = ?",
        [email]
    );

    const until = rows[0]?.locked_until ? Number(rows[0].locked_until) : 0;
    const remaining = until - now();

    return remaining > 0
        ? { locked: true, retryAfter: remaining }
        : { locked: false, retryAfter: 0 };
}

async function ensureRow(email) {
    try {
        await pdb.query(
            "INSERT INTO login_attempts (email, failed_count, locked_until) VALUES (?, 0, NULL)",
            [email]
        );
    } catch (error) {
        // Another request created the row first: that is fine.
        if (error.code !== "ER_DUP_ENTRY") throw error;
    }
}

// Records one wrong password. The row is locked while it is updated, so many
// simultaneous guesses cannot slip extra attempts past the limit.
// Returns { locked, attemptsLeft, retryAfter }.
async function recordFailure(email) {
    await ensureRow(email);

    const conn = await pdb.getConnection();

    try {
        await conn.beginTransaction();

        const [rows] = await conn.query(
            "SELECT failed_count, locked_until FROM login_attempts WHERE email = ? FOR UPDATE",
            [email]
        );

        const current = now();
        const row = rows[0] || { failed_count: 0, locked_until: null };
        const lockedUntil = row.locked_until ? Number(row.locked_until) : 0;

        // Still locked: do not count (or extend) anything.
        if (lockedUntil > current) {
            await conn.commit();

            return {
                locked: true,
                attemptsLeft: 0,
                retryAfter: lockedUntil - current
            };
        }

        // A finished lock starts a fresh count.
        const previous = lockedUntil > 0 ? 0 : Number(row.failed_count);
        const count = previous + 1;
        const lock = count >= MAX_ATTEMPTS;

        await conn.query(
            `UPDATE login_attempts
             SET failed_count = ?, locked_until = ?, last_failed_at = ?
             WHERE email = ?`,
            [count, lock ? current + LOCK_SECONDS : null, current, email]
        );

        await conn.commit();

        return {
            locked: lock,
            attemptsLeft: Math.max(0, MAX_ATTEMPTS - count),
            retryAfter: lock ? LOCK_SECONDS : 0
        };
    } catch (error) {
        await conn.rollback().catch(() => {});
        throw error;
    } finally {
        conn.release();
    }
}

// Successful login or password reset: start from zero again.
async function clearFailures(email) {
    await pdb.query("DELETE FROM login_attempts WHERE email = ?", [email]);
}

module.exports = {
    MAX_ATTEMPTS,
    LOCK_SECONDS,
    normalizeEmail,
    minutesLeft,
    getLock,
    recordFailure,
    clearFailures
};
