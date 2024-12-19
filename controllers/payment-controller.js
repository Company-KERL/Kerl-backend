const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Cart = require("../models/Cart");
const Razorpay = require("razorpay");
require("dotenv").config();

const createPayment = async (req, res) => {
  const { orderId, totalPrice } = req.body;

  try {
    var instance = new Razorpay({
      key_id: process.env.KEY_ID,
      key_secret: process.env.KEY_SECRET,
    });

    const razorpayOrder = await instance.orders.create({
      amount: totalPrice * 100,
      currency: "INR",
      receipt: require("crypto").randomBytes(16).toString("hex"),
    });

    if (!razorpayOrder) {
      return res
        .status(500)
        .json({
          message: "Failed to create Razorpay order",
          error: razorpayOrder.error,
        });
    }
    await Payment.create({
      orderId,
      rpOrderId: razorpayOrder.id,
      status: "pending",
    });
    res
      .status(201)
      .json({ message: "Payment created", razorpayOrderId: razorpayOrder.id });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating payment", error: error.message });
  }
};

const crypto = require("crypto");

const updatePayment = async (req, res) => {
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    orderId,
    userId,
  } = req.body;

  try {
    // Fetch the payment and validate its existence
    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Validate Razorpay signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      payment.status = "failed";
      order.paymentStatus = "failed";
      await payment.save();
      await order.save();
      return res.status(400).json({ message: "Invalid signature" });
    }

    // Update payment status
    payment.status = "completed";
    payment.rpPaymentId = razorpayPaymentId;
    payment.rpSignature = razorpaySignature;
    payment.rpOrderId = razorpayOrderId;
    await payment.save();

    // Update associated order status

    order.paymentStatus = "completed";
    await order.save();

    // Clear the user's cart
    const cart = await Cart.findOneAndDelete({ userId });
    if (!cart) {
      return res
        .status(500)
        .json({ message: "Error clearing cart after payment" });
    }

    // Respond with success
    res.status(200).json({
      message: "Payment updated successfully",
      payment,
      order,
    });
  } catch (error) {
    console.error("Error updating payment:", error.message);
    res
      .status(500)
      .json({ message: "Error updating payment", error: error.message });
  }
};

module.exports = { createPayment, updatePayment };
