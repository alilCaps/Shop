const express = require("express");
const router = express.Router();

const {
    login,
    signup
} = require("../controllers/authController");

const {
    requestCode,
    verifyCode,
    resetPassword
} = require("../controllers/passwordResetController");

router.post("/login", login);
router.post("/signup", signup);

// Forgot password: 1) email -> code, 2) code -> token, 3) token -> new password
router.post("/forgot-password", requestCode);
router.post("/forgot-password/verify", verifyCode);
router.post("/forgot-password/reset", resetPassword);

module.exports = router;
