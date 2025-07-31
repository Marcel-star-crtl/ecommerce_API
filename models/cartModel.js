const mongoose = require("mongoose"); 

var cartSchema = new mongoose.Schema(
  {
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        count: {
          type: Number,
          required: true,
          min: 1
        },
        color: {
          type: String,
          default: "default"
        },
        price: {
          type: Number,
          required: true
        },
      },
    ],
    cartTotal: {
      type: Number,
      default: 0
    },
    totalAfterDiscount: {
      type: Number,
      default: 0
    },
    orderby: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
  },
  {
    timestamps: true,
  }
);

cartSchema.index({ orderby: 1 });

module.exports = mongoose.model("Cart", cartSchema);