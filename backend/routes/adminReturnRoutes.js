const express = require("express");
const router = express.Router();

const returns = require("../controllers/returnController");
const { authenticate, requireRole } = require("../utils/auth");

router.use(authenticate, requireRole("ADMIN"));

router.get("/", returns.listAdminReturns);
router.put("/:returnId", returns.updateAdminReturn);

module.exports = router;
