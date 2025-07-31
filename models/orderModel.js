const mongoose = require("mongoose");
const shortid = require('shortid');

const orderSchema = new mongoose.Schema(
  {
    shortId: {
      type: String,
      unique: true,
      default: shortid.generate,
    },
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
          min: 1,
          default: 1
        },
        color: {
          type: String,
          default: 'default'
        },
      },
    ],
    paymentIntent: {
      type: String,
      required: true,
      enum: ["Cash on Delivery", "PayPal", "Mobile Money", "Stripe"],
      default: "Cash on Delivery" 
    },
    paypalOrderId: {
      type: String,
      required: false
    },
    stripeSessionId: {
      type: String,
      required: false
    },
    mobileMoneyTransactionId: {
      type: String,
      required: false
    },
    orderStatus: {
      type: String,
      default: "Not Processed",
      enum: [
        "Not Processed",
        "Pending",
        "Processing",
        "Dispatched",
        "Cancelled",
        "Delivered",
      ],
    },
    dispatchTime: {
      type: Date,
    },
    dispatchedAt: {
      type: Date,
    },
    expectedDeliveryAt: {
      type: Date,
    },
    deliveryConfirmed: {
      type: Boolean,
      default: false,
    },
    orderby: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    userDetails: {
      email: String,
      name: String,
      address: String,
      postalCode: String,
      city: String,
      country: String,
      phone: String,
    },
    totalAmount: {
      type: Number,
      required: true
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
