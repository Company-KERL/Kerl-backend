// Import the required models
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Add an item to the cart
const addItemToCart = async (req, res) => {
  const { userId, productId, quantity, selectedSizeIndex } = req.body;

  try {
    // Check if the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Find the user's cart or create a new one if it doesn't exist
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [], totalPrice: 0 });
    }

    // Check if the product is already in the cart
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productId &&
        item.selectedSizeIndex === selectedSizeIndex
    );

    if (existingItemIndex > -1) {
      // Update the quantity and price if the product already exists in the cart
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].price =
        cart.items[existingItemIndex].quantity *
        product.prices[selectedSizeIndex]; // Use appropriate size/price index
    } else {
      // Add a new item to the cart
      cart.items.push({
        productId,
        quantity,
        price: quantity * product.prices[selectedSizeIndex],
        selectedSizeIndex,
      });
    }

    // Update total price
    cart.totalPrice = cart.items.reduce((total, item) => total + item.price, 0);

    await cart.save();
    res.status(200).json({ message: "Item added to cart", cart });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding item to cart", error: error.message });
  }
};

// Remove an item from the cart
const removeItemFromCart = async (req, res) => {
  const { userId, productId } = req.body;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Remove the product from the cart
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    // Update total price
    cart.totalPrice = cart.items.reduce((total, item) => total + item.price, 0);

    await cart.save();
    res.status(200).json({ message: "Item removed from cart", cart });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error removing item from cart", error: error.message });
  }
};

// Get all items in the cart
const getCartItems = async (req, res) => {
  const { userId } = req.params;

  try {
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    res.status(200).json({ message: "Cart retrieved", cart });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving cart", error: error.message });
  }
};

//Get the length of the cart
const getCartLength = async (req, res) => {
  const { userId } = req.params;
  try {
    // Find the cart for the user and populate the product details
    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Calculate the total quantity of items in the cart
    const cartLength = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    // Return the total quantity
    res.status(200).json({ message: "Cart retrieved", cartLength });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving cart", error: error.message });
  }
};



// Update item quantity in the cart
const updateCartItemQuantity = async (req, res) => {
  const { userId, productId, quantity, selectedSizeIndex } = req.body;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId && item.selectedSizeIndex === selectedSizeIndex
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Update quantity and price
    cart.items[itemIndex].quantity = quantity;
    const product = await Product.findById(productId);
    cart.items[itemIndex].price = quantity * product.prices[selectedSizeIndex]; // Use appropriate size/price index

    // Update total price
    cart.totalPrice = cart.items.reduce((total, item) => total + item.price, 0);

    await cart.save();
    res.status(200).json({ message: "Cart item quantity updated", cart });
  } catch (error) {
    res.status(500).json({
      message: "Error updating cart item quantity",
      error: error.message,
    });
  }
};

module.exports = {
  addItemToCart,
  removeItemFromCart,
  getCartItems,
  updateCartItemQuantity,
  getCartLength
};
