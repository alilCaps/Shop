const express = require("express");
const router = express.Router();

const {
    getUsers,
    getUserById,
    updateUser
} = require("../controllers/userController");

router.get("/", getUsers);
router.get("/:userId", getUserById);
router.put("/:userId", updateUser);

module.exports = router;