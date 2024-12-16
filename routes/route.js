const express = require("express");
const userController = require("../controllers/user-controller");
const productController = require("../controllers/product-controller");
const cartController = require("../controllers/cart-controller");
const orderController = require("../controllers/order-controller");

const router = express.Router();

// Define User routes
router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.get("/profile", userController.getProfile);
router.put("/profile", userController.updateUser);
router.get("/check-auth", userController.checkAuth);

// Define Product routes
router.post("/products", productController.addProduct);
router.get("/products", productController.getAllProducts);
router.get("/products/:id", productController.getProductById);
router.put("/products/:id", productController.updateProduct);
router.delete("/products/:id", productController.deleteProduct);

// Define Cart routes
router.post("/cart", cartController.addItemToCart);
router.delete("/cart", cartController.removeItemFromCart);
router.get("/cart/:userId", cartController.getCartItems);
router.put("/cart", cartController.updateCartItemQuantity);
router.get("/cart/:userId/length", cartController.getCartLength);
router.delete("/cart/:userId", cartController.clearCart);

// Define Order routes
router.post("/orders", orderController.createOrder);
router.get("/orders/:userId", orderController.getUserOrders);
router.put("/orders", orderController.updateOrderStatus);
router.delete("/orders/:orderId", orderController.deleteOrder);
router.get("/orders/addresses/:userId", orderController.getAddresses);

module.exports = router;
