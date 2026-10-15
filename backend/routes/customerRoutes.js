const express = require("express");
const router = express.Router();

const {
    getDashboardStats,
    getOrderOnTheWay,
    getCustomerOrders
} = require("../controllers/customerController");

router.get("/:userId/dashboard-stats", getDashboardStats);

router.get("/:userId/orders/on-the-way", getOrderOnTheWay);

router.get("/:userId/orders", getCustomerOrders);

module.exports = router;