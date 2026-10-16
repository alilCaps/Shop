
const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");

// Dashboard overview
router.get("/overview", adminController.getAdminOverview);

// User management
router.get("/users", adminController.getUsers);
router.put("/users/:userId", adminController.updateUser);

// Seller management
router.get("/sellers", adminController.getSellers);

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

module.exports = router;
