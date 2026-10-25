const express = require("express");
const router = express.Router();

const seller = require("../controllers/sellerController");
const { authenticate } = require("../utils/auth");
const { requireUser } = require("../utils/helpers");

router.use(authenticate);

// requireUser = logged in as :userId, requireSeller = has the seller role
const guard = [requireUser, seller.requireSeller];

router.get("/:userId/dashboard", guard, seller.getDashboard);

router.get("/:userId/shop", guard, seller.getShop);
router.post("/:userId/shop", guard, seller.createShop);
router.put("/:userId/shop", guard, seller.updateShop);

router.get("/:userId/products", guard, seller.listProducts);
router.post("/:userId/products", guard, seller.createProduct);
router.put("/:userId/products/:productId", guard, seller.updateProduct);
router.delete("/:userId/products/:productId", guard, seller.archiveProduct);

router.get("/:userId/orders", guard, seller.listOrders);
router.put("/:userId/orders/:orderId/status", guard, seller.updateOrderStatus);

module.exports = router;
