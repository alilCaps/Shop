const bcrypt = require("bcrypt");
const crypto = require("crypto");

const { pdb, handler, notify } = require("../utils/helpers");
const { hashSecret, safeEqualHex } = require("../utils/auth");
const { normalizeEmail, clearFailures } = require("../utils/loginAttempts");
const { sendResetCode } = require("../utils/mailer");

const CODE_TTL = 10 * 60; // the emailed code works for 10 minutes
const TOKEN_TTL = 10 * 60; // after the code is accepted, 10 minutes to pick a password
const MAX_CODE_ATTEMPTS = 5; // wrong guesses allowed per code
const RESEND_COOLDOWN = 60; // seconds between two codes
const MAX_CODES_PER_HOUR = 5;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The same answer whether or not the email is registered, so nobody can use
// this form to discover which emails have accounts.
const SENT_MESSAGE =
    "If an account exists for that email, a verification code has been sent.";

const now = () => Math.floor(Date.now() / 1000);

// STEP 1 - POST /forgot-password  { email }
exports.requestCode = handler(async function requestCode(req, res) {
    const email = normalizeEmail(req.body?.email);

    if (!email || !EMAIL_PATTERN.test(email)) {
        return res.status(400).json({ message: "Enter a valid email address." });
    }

    const reply = () =>
        res.json({ message: SENT_MESSAGE, cooldown_seconds: RESEND_COOLDOWN });

    const [users] = await pdb.query(
        "SELECT user_id, email, status FROM users WHERE email = ?",
        [email]
    );

    const user = users[0];

    if (!user || user.status !== "ACTIVE") return reply();

    const current = now();

    const [recent] = await pdb.query(
        `SELECT created_at FROM password_resets
         WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
        [user.user_id]
    );

    if (recent[0] && current - Number(recent[0].created_at) < RESEND_COOLDOWN) {
        return reply();
    }

    const [counts] = await pdb.query(
        `SELECT COUNT(*) AS total FROM password_resets
         WHERE user_id = ? AND created_at > ?`,
        [user.user_id, current - 3600]
    );

    if (Number(counts[0].total) >= MAX_CODES_PER_HOUR) return reply();

    const code = crypto.randomInt(0, 1000000).toString().padStart(6, "0");

    // A new code replaces any earlier one.
    await pdb.query(
        "UPDATE password_resets SET used_at = ? WHERE user_id = ? AND used_at IS NULL",
        [current, user.user_id]
    );

    await pdb.query(
        `INSERT INTO password_resets (user_id, code_hash, expires_at, created_at)
         VALUES (?, ?, ?, ?)`,
        [
            user.user_id,
            hashSecret("reset-code", `${user.user_id}:${code}`),
            current + CODE_TTL,
            current
        ]
    );

    // Not awaited on purpose: the response time must not reveal whether the
    // email exists. A failure is logged; the user can ask for another code.
    sendResetCode(user.email, code, CODE_TTL / 60).catch((error) =>
        console.error("RESET EMAIL ERROR:", error.message)
    );

    return reply();
});

// STEP 2 - POST /forgot-password/verify  { email, code }
exports.verifyCode = handler(async function verifyCode(req, res) {
    const email = normalizeEmail(req.body?.email);
    const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";

    const wrong = () =>
        res.status(400).json({ message: "Incorrect verification code." });

    if (!email || !/^\d{6}$/.test(code)) return wrong();

    const [users] = await pdb.query(
        "SELECT user_id, status FROM users WHERE email = ?",
        [email]
    );

    const user = users[0];

    if (!user || user.status !== "ACTIVE") return wrong();

    const current = now();

    const [rows] = await pdb.query(
        `SELECT reset_id, code_hash, expires_at
         FROM password_resets
         WHERE user_id = ? AND used_at IS NULL AND verified_at IS NULL
         ORDER BY reset_id DESC LIMIT 1`,
        [user.user_id]
    );

    const reset = rows[0];

    if (!reset) return wrong();

    if (Number(reset.expires_at) <= current) {
        return res.status(400).json({
            message: "This verification code has expired. Please request a new one."
        });
    }

    // Use up one attempt BEFORE comparing. Because this is a single atomic
    // UPDATE, even many simultaneous guesses get at most MAX_CODE_ATTEMPTS
    // comparisons in total.
    const [claim] = await pdb.query(
        `UPDATE password_resets
         SET attempts = attempts + 1
         WHERE reset_id = ? AND used_at IS NULL AND verified_at IS NULL
           AND attempts < ?`,
        [reset.reset_id, MAX_CODE_ATTEMPTS]
    );

    if (claim.affectedRows === 0) {
        return res.status(429).json({
            message: "Too many incorrect attempts. Please request a new code."
        });
    }

    const expected = hashSecret("reset-code", `${user.user_id}:${code}`);

    if (!safeEqualHex(reset.code_hash, expected)) return wrong();

    // Correct code: hand out a one-time token for the password step.
    const token = crypto.randomBytes(32).toString("hex");

    const [done] = await pdb.query(
        `UPDATE password_resets
         SET verified_at = ?, token_hash = ?, token_expires_at = ?
         WHERE reset_id = ? AND verified_at IS NULL AND used_at IS NULL`,
        [current, hashSecret("reset-token", token), current + TOKEN_TTL, reset.reset_id]
    );

    if (done.affectedRows === 0) return wrong();

    return res.json({
        message: "Code verified.",
        reset_token: token,
        expires_in: TOKEN_TTL
    });
});

// STEP 3 - POST /forgot-password/reset  { reset_token, new_password }
exports.resetPassword = handler(async function resetPassword(req, res) {
    const token =
        typeof req.body?.reset_token === "string" ? req.body.reset_token : "";
    const password =
        typeof req.body?.new_password === "string" ? req.body.new_password : "";

    const expired = () =>
        res.status(400).json({
            message: "Your reset session has expired. Please start again."
        });

    if (!/^[a-f0-9]{64}$/.test(token)) return expired();

    // bcrypt only uses the first 72 bytes of a password.
    if (
        password.length < 8 ||
        Buffer.byteLength(password) > 72 ||
        !password.trim()
    ) {
        return res.status(400).json({
            message: "The new password must be 8 to 72 characters long."
        });
    }

    const current = now();

    const [rows] = await pdb.query(
        `SELECT r.reset_id, r.user_id, u.email, u.status
         FROM password_resets r
         INNER JOIN users u ON u.user_id = r.user_id
         WHERE r.token_hash = ? AND r.used_at IS NULL AND r.token_expires_at > ?`,
        [hashSecret("reset-token", token), current]
    );

    const reset = rows[0];

    if (!reset || reset.status !== "ACTIVE") return expired();

    // Claim the token first so it can only ever be used once.
    const [claim] = await pdb.query(
        "UPDATE password_resets SET used_at = ? WHERE reset_id = ? AND used_at IS NULL",
        [current, reset.reset_id]
    );

    if (claim.affectedRows === 0) return expired();

    const hash = await bcrypt.hash(password, 10);

    await pdb.query("UPDATE users SET password_hash = ? WHERE user_id = ?", [
        hash,
        reset.user_id
    ]);

    // Any other outstanding code for this account is now void, and a lockout
    // from earlier failed logins is lifted (they proved they own the email).
    await pdb.query(
        "UPDATE password_resets SET used_at = ? WHERE user_id = ? AND used_at IS NULL",
        [current, reset.user_id]
    );

    await clearFailures(normalizeEmail(reset.email));

    await notify(
        null,
        reset.user_id,
        "Password changed",
        "Your password was changed. If this was not you, contact support right away.",
        "SYSTEM"
    );

    return res.json({
        message: "Your password has been updated. You can now log in."
    });
});
