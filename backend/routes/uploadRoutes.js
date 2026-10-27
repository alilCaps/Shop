const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const { authenticate } = require("../utils/auth");
const { pdb, handler } = require("../utils/helpers");

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const MAX_BYTES = 5 * 1024 * 1024;

// Identify the image by its first bytes, never by what the browser claims.
function detectImage(buffer) {
    if (buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) {
        return { ext: ".png", mime: "image/png" };
    }

    if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return { ext: ".jpg", mime: "image/jpeg" };
    }

    if (buffer.length > 6 && buffer.subarray(0, 4).toString("ascii") === "GIF8") {
        return { ext: ".gif", mime: "image/gif" };
    }

    if (
        buffer.length > 12 &&
        buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
        buffer.subarray(8, 12).toString("ascii") === "WEBP"
    ) {
        return { ext: ".webp", mime: "image/webp" };
    }

    return null;
}

// Images arrive as JSON { data: "data:image/png;base64,...." } so no extra
// packages are needed. This parser only applies to this route.
router.post(
    "/",
    authenticate,
    express.json({ limit: "8mb" }),
    handler(async function uploadImage(req, res) {
        const raw = typeof req.body?.data === "string" ? req.body.data : "";
        const match = /^data:image\/[a-z0-9.+-]+;base64,([A-Za-z0-9+/=\s]+)$/i.exec(raw);

        if (!match) {
            return res.status(400).json({ message: "Choose an image file to upload." });
        }

        const buffer = Buffer.from(match[1], "base64");

        if (buffer.length === 0 || buffer.length > MAX_BYTES) {
            return res.status(413).json({ message: "Images must be 5 MB or smaller." });
        }

        const type = detectImage(buffer);

        if (!type) {
            return res.status(415).json({
                message: "Only PNG, JPG, GIF or WebP images can be uploaded."
            });
        }

        fs.mkdirSync(UPLOAD_DIR, { recursive: true });

        const name = `${crypto.randomBytes(16).toString("hex")}${type.ext}`;
        await fs.promises.writeFile(path.join(UPLOAD_DIR, name), buffer);

        const url = `/uploads/${name}`;

        // Best-effort record (table comes from migration 004).
        try {
            await pdb.query(
                `INSERT INTO uploaded_files (user_id, file_path, mime_type, size_bytes)
                 VALUES (?, ?, ?, ?)`,
                [req.auth.uid, url, type.mime, buffer.length]
            );
        } catch (error) {
            console.warn("UPLOAD LOG skipped:", error.code || error.message);
        }

        res.status(201).json({ url });
    })
);

// Bad JSON / oversized body -> clean message instead of an HTML error page.
router.use((error, req, res, next) => {
    if (error.type === "entity.too.large") {
        return res.status(413).json({ message: "Images must be 5 MB or smaller." });
    }

    if (error.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Invalid upload." });
    }

    return next(error);
});

module.exports = router;
