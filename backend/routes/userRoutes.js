const express = require("express");
const router = express.Router();

const {
    getUsers,
    getUserById,
    updateUser
} = require("../controllers/userController");

const {
    authenticate,
    requireRole,
    requireSelfOrAdmin
} = require("../utils/auth");

// Listing every account is admin-only; a single account is readable and
// editable by its owner (or an admin).
router.get("/", authenticate, requireRole("ADMIN"), getUsers);
router.get("/:userId", authenticate, requireSelfOrAdmin, getUserById);
router.put("/:userId", authenticate, requireSelfOrAdmin, updateUser);

module.exports = router;
