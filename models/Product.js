const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    sizes: { type: [String], required: true },
    prices: { type: [Number], required: true },
    offers: { type: [Number] },
    images: {
      type: [[String]],
      required: true,
    },
    stock: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
