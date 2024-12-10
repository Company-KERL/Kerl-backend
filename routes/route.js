const express = require("express");
const userController = require("../controllers/user-controller");
const productController = require("../controllers/product-controller");

const router = express.Router();

// Define User routes
router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.get("/profile", userController.getProfile);
router.put("/profile", userController.updateUser);

// Define Product routes
router.post("/products", productController.addProduct);
router.get("/products", productController.getAllProducts);
router.get("/products/:id", productController.getProductById);
router.put("/products/:id", productController.updateProduct);
router.delete("/products/:id", productController.deleteProduct);

module.exports = router;
