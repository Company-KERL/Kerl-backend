const Order = require("../models/Order");
const Product = require("../models/Product");

const createOrder = async (req, res) => {
  const { userId, items, address } = req.body;

  try {
    let totalPrice = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product with ID ${item.productId} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product: ${product.name}`,
        });
      }

      const itemPrice = item.quantity * product.prices[item.selectedSizeIndex];
      totalPrice += itemPrice;
      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: itemPrice,
        selectedSizeIndex: item.selectedSizeIndex,
      });
    }

    const order = new Order({
      userId,
      items: validatedItems,
      totalPrice,
      address,
    });

    // Reduce stock for ordered products
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    await order.save();
    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating order", error: error.message });
  }
};

// Get all orders for a user
const getUserOrders = async (req, res) => {
  const { userId } = req.params;

  try {
    const orders = await Order.find({ userId }).populate("items.productId");
    if (!orders || orders.length === 0) {
      return res
        .status(404)
        .json({ message: "No orders found for this user", orders });
    }

    res.status(200).json({ message: "Orders retrieved successfully", orders });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving orders", error: error.message });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  const { orderId, status } = req.body;

  try {
    const validStatuses = ["pending", "shipped", "delivered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    await order.save();

    res
      .status(200)
      .json({ message: "Order status updated successfully", order });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating order status", error: error.message });
  }
};

// Delete an order
const deleteOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findByIdAndDelete(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting order", error: error.message });
  }
};

// Get all adresses from previous orders
const getAddresses = async (req, res) => {
  const { userId } = req.params;

  try {
    const orders = await Order.find({ userId });
    if (!orders || orders.length === 0) {
      return res
        .ok()
        .status(200)
        .json({ message: "No orders found for this user", addresses: [] });
    }

    const addresses = orders.map((order) => order.address);
    res
      .status(200)
      .json({ message: "Addresses retrieved successfully", addresses });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving addresses", error: error.message });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  updateOrderStatus,
  deleteOrder,
  getAddresses,
};
