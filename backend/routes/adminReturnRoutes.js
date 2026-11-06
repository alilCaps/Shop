const express = require("express");
const router = express.Router();

const returns = require("../controllers/returnController");
const { authenticate, requireRole } = require("../utils/auth");
const { requireActiveAccount, rejectNestedValues } = require("../utils/helpers");

router.use(authenticate, requireRole("ADMIN"), requireActiveAccount, rejectNestedValues);

router.get("/", returns.listAdminReturns);
router.put("/:returnId", returns.updateAdminReturn);

module.exports = router;
