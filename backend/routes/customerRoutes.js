const express = require("express");
const router = express.Router();

const {
    getDashboardStats,
    getOrderOnTheWay
} = require("../controllers/customerController");

const shopper = require("../controllers/shopperController");
const returns = require("../controllers/returnController");
const { authenticate } = require("../utils/auth");
const { requireUser } = require("../utils/helpers");

// Every customer route needs a valid login token that belongs to :userId.
router.use(authenticate);

// Dashboard
router.get("/:userId/dashboard-stats", requireUser, getDashboardStats);
router.get("/:userId/orders/on-the-way", requireUser, getOrderOnTheWay);

// Orders (add ?include=items for the full list with products)
router.get("/:userId/orders", requireUser, shopper.listOrders);
router.post("/:userId/orders/:orderId/cancel", requireUser, shopper.cancelOrder);
router.post("/:userId/orders/:orderId/pay", requireUser, shopper.payOrder);
router.post("/:userId/orders/:orderId/receive", requireUser, shopper.receiveOrder);
router.post(
    "/:userId/orders/:orderId/items/:orderItemId/review",
    requireUser,
    shopper.reviewItem
);

// Returns / refunds (3 days after delivery)
router.post("/:userId/orders/:orderId/return", requireUser, returns.createReturn);
router.get("/:userId/returns", requireUser, returns.listCustomerReturns);
router.post("/:userId/returns/:returnId/cancel", requireUser, returns.cancelReturn);
router.post("/:userId/returns/:returnId/ship-back", requireUser, returns.shipBackReturn);

// Cart
router.get("/:userId/cart", requireUser, shopper.getCart);
router.post("/:userId/cart", requireUser, shopper.addToCart);
router.put("/:userId/cart/:cartItemId", requireUser, shopper.updateCartItem);
router.delete("/:userId/cart/:cartItemId", requireUser, shopper.removeCartItem);

// Wishlist
router.get("/:userId/wishlist", requireUser, shopper.getWishlist);
router.post("/:userId/wishlist", requireUser, shopper.addToWishlist);
router.delete("/:userId/wishlist/:productId", requireUser, shopper.removeFromWishlist);

// Addresses
router.get("/:userId/addresses", requireUser, shopper.getAddresses);
router.post("/:userId/addresses", requireUser, shopper.createAddress);
router.put("/:userId/addresses/:addressId", requireUser, shopper.updateAddress);
router.put("/:userId/addresses/:addressId/default", requireUser, shopper.setDefaultAddress);
router.delete("/:userId/addresses/:addressId", requireUser, shopper.deleteAddress);

// Payments history + checkout
router.get("/:userId/payments", requireUser, shopper.getPayments);
router.post("/:userId/checkout", requireUser, shopper.checkout);

module.exports = router;
