const bcrypt = require("bcrypt");
const crypto = require("crypto");

const { pdb, handler } = require("../utils/helpers");
const { createToken } = require("../utils/auth");
const {
    MAX_ATTEMPTS,
    LOCK_SECONDS,
    normalizeEmail,
    minutesLeft,
    getLock,
    recordFailure,
    clearFailures
} = require("../utils/loginAttempts");

// Checked when the email does not exist, so a wrong email takes as long as a
// wrong password and the response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString("hex"), 10);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[A-Za-z0-9_.-]{3,50}$/;
const PHONE_PATTERN = /^[0-9+()\-\s]{7,30}$/;

function lockedResponse(res, retryAfter, justLocked) {
    const minutes = minutesLeft(retryAfter);

    res.set("Retry-After", String(retryAfter));

    return res.status(429).json({
        message: justLocked
            ? `Too many failed login attempts. Your account is locked for ${LOCK_SECONDS / 60} minutes.`
            : `Too many failed login attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
        locked: true,
        retry_after_seconds: retryAfter
    });
}

// LOGIN
const login = handler(async function login(req, res) {
    // Only plain strings are accepted (never objects or arrays).
    const email = normalizeEmail(req.body?.email);
    const password =
        typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password) {
        return res.status(400).json({
            message: "Email or password is missing."
        });
    }

    // 1) Locked? Refuse before even looking at the password.
    const lock = await getLock(email);

    if (lock.locked) {
        return lockedResponse(res, lock.retryAfter, false);
    }

    const [rows] = await pdb.query(
        `SELECT
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
         INNER JOIN roles r ON u.role_id = r.role_id
         WHERE u.email = ?`,
        [email]
    );

    const user = rows[0];

    // 2) Always run one bcrypt comparison, real or dummy.
    const passwordMatch = await bcrypt.compare(
        password,
        user ? user.password_hash : DUMMY_HASH
    );

    // 3) Wrong email or password: count it, lock after MAX_ATTEMPTS.
    if (!user || !passwordMatch) {
        const failure = await recordFailure(email);

        if (failure.locked) {
            return lockedResponse(res, failure.retryAfter, true);
        }

        return res.status(401).json({
            message:
                `Invalid email or password. You have ${failure.attemptsLeft} ` +
                `attempt${failure.attemptsLeft === 1 ? "" : "s"} left before your account is locked.`,
            attempts_left: failure.attemptsLeft
        });
    }

    // 4) Right password, but the account may be disabled. Only now is that
    //    revealed, so it cannot be used to probe for accounts.
    if (user.status !== "ACTIVE") {
        return res.status(403).json({
            message: "Account is not active."
        });
    }

    await clearFailures(email);

    pdb.query("UPDATE users SET last_login_at = NOW() WHERE user_id = ?", [
        user.user_id
    ]).catch(() => {});

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
});

// SIGNUP
const signup = handler(async function signup(req, res) {
    const body = req.body || {};

    if (
        ![body.phone, body.username, body.email, body.password].every(
            (value) => typeof value === "string" && value.trim() !== ""
        )
    ) {
        return res.status(400).json({
            message: "All fields are required."
        });
    }

    const phone = body.phone.trim();
    const username = body.username.trim();
    const email = normalizeEmail(body.email);
    const password = body.password;

    if (!EMAIL_PATTERN.test(email)) {
        return res.status(400).json({ message: "Enter a valid email address." });
    }

    if (!USERNAME_PATTERN.test(username)) {
        return res.status(400).json({
            message:
                "Username must be 3 to 50 characters: letters, numbers, dots, dashes or underscores."
        });
    }

    if (!PHONE_PATTERN.test(phone)) {
        return res.status(400).json({ message: "Enter a valid phone number." });
    }

    // bcrypt only uses the first 72 bytes of a password.
    if (password.length < 8 || Buffer.byteLength(password) > 72) {
        return res.status(400).json({
            message: "Password must be 8 to 72 characters long."
        });
    }

    const [existing] = await pdb.query(
        "SELECT user_id FROM users WHERE username = ? OR email = ?",
        [username, email]
    );

    if (existing.length > 0) {
        return res.status(409).json({
            message: "Username or email is already registered."
        });
    }

    // Only customers and sellers can self-register (never admins).
    const wantedRole = body.account_type === "seller" ? "seller" : "customer";

    const [roles] = await pdb.query(
        "SELECT role_id FROM roles WHERE LOWER(role_name) = ? LIMIT 1",
        [wantedRole]
    );

    if (roles.length === 0) {
        return res.status(500).json({
            message: "Unable to create account."
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const [result] = await pdb.query(
            `INSERT INTO users
                (username, email, password_hash, first_name, last_name, phone, status, role_id)
             VALUES (?, ?, ?, '', '', ?, 'ACTIVE', ?)`,
            [username, email, hashedPassword, phone, roles[0].role_id]
        );

        return res.status(201).json({
            message: "Account created successfully.",
            user_id: result.insertId
        });
    } catch (error) {
        // Two people registering the same name at the same moment.
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Username or email is already registered."
            });
        }

        throw error;
    }
});

module.exports = {
    login,
    signup,
    MAX_ATTEMPTS
};
