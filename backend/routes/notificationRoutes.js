const express = require("express");
const router = express.Router();

const { authenticate } = require("../utils/auth");
const { pdb, validId, handler } = require("../utils/helpers");

// Notifications belong to whoever is logged in (customers and sellers).
router.use(authenticate);

router.get(
    "/",
    handler(async function listNotifications(req, res) {
        const [rows] = await pdb.query(
            `SELECT notification_id, title, message, notification_type,
                    reference_id, is_read, created_at
             FROM notifications
             WHERE user_id = ?
             ORDER BY created_at DESC, notification_id DESC
             LIMIT 100`,
            [req.auth.uid]
        );

        res.json({
            notifications: rows,
            unread: rows.filter((row) => !row.is_read).length
        });
    })
);

router.put(
    "/read-all",
    handler(async function readAll(req, res) {
        await pdb.query(
            "UPDATE notifications SET is_read = 1 WHERE user_id = ?",
            [req.auth.uid]
        );

        res.json({ message: "All notifications marked as read." });
    })
);

router.put(
    "/:notificationId/read",
    handler(async function readOne(req, res) {
        if (!validId(req.params.notificationId)) {
            return res.status(400).json({ message: "Invalid notification." });
        }

        await pdb.query(
            "UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?",
            [Number(req.params.notificationId), req.auth.uid]
        );

        res.json({ message: "Notification marked as read." });
    })
);

module.exports = router;
