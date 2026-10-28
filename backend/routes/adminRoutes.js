
const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const adminExtra = require("../controllers/adminExtraController");
const { authenticate, requireRole } = require("../utils/auth");

// Everything under /api/admin needs an administrator token.
router.use(authenticate, requireRole("ADMIN"));

// Dashboard overview
router.get("/overview", adminController.getAdminOverview);

// User management
router.get("/users", adminController.getUsers);
router.put("/users/:userId", adminController.updateUser);

// Seller management
router.get("/sellers", adminController.getSellers);
router.put("/sellers/:userId", adminController.updateUser);

// Shop management
router.get("/shops", adminController.getShops);
router.put("/shops/:shopId", adminController.updateShop);

// Category management
router.get("/categories", adminController.getCategories);
router.post("/categories", adminController.createCategory);
router.put("/categories/:categoryId", adminController.updateCategory);

// Product management
router.get("/products", adminController.getProducts);
router.put("/products/:productId", adminController.updateProduct);

// Orders (update also keeps stock / payments / shipments in sync)
router.get("/orders", adminController.getOrders);
router.put("/orders/:orderId", adminExtra.updateOrder);

// Reviews
router.get("/reviews", adminController.getReviews);
router.put("/reviews/:reviewId", adminController.updateReview);

// Notifications
router.get("/notifications", adminController.getNotifications);
router.put(
  "/notifications/:notificationId",
  adminController.updateNotification
);

// Activity logs (read-only)
router.get("/activity-logs", adminController.getActivityLogs);

// Reports
router.get("/reports", adminExtra.getReports);

// Transactions
router.get("/transactions", adminController.getTransactions);
router.put("/transactions/:paymentId", adminController.updateTransaction);

// Admin profile (the logged-in administrator)
router.get("/profile", adminExtra.getProfile);
router.put("/profile", adminExtra.updateProfile);
router.put("/profile/password", adminExtra.changePassword);

// System settings
router.get("/settings", adminExtra.getSettings);
router.put("/settings/:settingId", adminExtra.updateSetting);

module.exports = router;
