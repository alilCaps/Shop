const crypto = require("crypto");

// Set AUTH_SECRET in backend/.env so tokens survive server restarts.
const SECRET =
    process.env.AUTH_SECRET || crypto.randomBytes(32).toString("hex");

const TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

function sign(payload) {
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
        .createHmac("sha256", SECRET)
        .update(body)
        .digest("base64url");

    return `${body}.${signature}`;
}

function verify(token) {
    if (typeof token !== "string") return null;

    const [body, signature] = token.split(".");
    if (!body || !signature) return null;

    const expected = crypto
        .createHmac("sha256", SECRET)
        .update(body)
        .digest("base64url");

    const a = Buffer.from(signature);
    const b = Buffer.from(expected);

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    try {
        const payload = JSON.parse(
            Buffer.from(body, "base64url").toString("utf8")
        );

        if (!payload.exp || payload.exp < Date.now()) return null;

        return payload;
    } catch {
        return null;
    }
}

function createToken(user) {
    return sign({
        uid: Number(user.user_id),
        role: String(user.role_name || "").toUpperCase(),
        exp: Date.now() + TOKEN_LIFETIME_MS
    });
}

// Requires a valid "Authorization: Bearer <token>" header.
function authenticate(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    const payload = verify(token);

    if (!payload) {
        return res.status(401).json({
            message: "Your session has expired. Please log in again."
        });
    }

    req.auth = payload;
    return next();
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.auth || !roles.includes(req.auth.role)) {
            return res.status(403).json({
                message: "You do not have permission to do this."
            });
        }

        return next();
    };
}

// The :userId in the URL must be the logged-in user (admins also allowed).
function requireSelfOrAdmin(req, res, next) {
    const target = Number(req.params.userId);

    if (
        req.auth &&
        (req.auth.uid === target || req.auth.role === "ADMIN")
    ) {
        return next();
    }

    return res.status(403).json({
        message: "You do not have permission to access this account."
    });
}

module.exports = {
    createToken,
    authenticate,
    requireRole,
    requireSelfOrAdmin
};
