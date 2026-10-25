const express = require("express");
const router = express.Router();

const {
    getProducts
} = require("../controllers/productController");

const {
    getProductById
} = require("../controllers/productDetailController");

router.get("/", getProducts);
router.get("/:productId", getProductById);

module.exports = router;
