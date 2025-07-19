// const mongoose = require("mongoose");

// const orderSchema = new mongoose.Schema(
//   {
//     products: [
//       {
//         product: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Product",
//         },
//         count: Number,
//         color: String,
//       },
//     ],
//     paymentIntent: {
//       type: String,
//       required: true,
//       enum: ["Cash on Delivery", "PayPal"],
//     },
//     orderStatus: {
//       type: String,
//       default: "Not Processed",
//       enum: [
//         "Not Processed",
//         "Processing",
//         "Dispatched",
//         "Cancelled",
//         "Delivered",
//       ],
//     },
//     orderby: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//     userDetails: {
//       email: String,
//       lastName: String,
//       address: String,
//       suite: String,
//       city: String,
//       country: String,
//       phone: String,
//     },
//     totalAmount: Number,
//   },
//   {
//     timestamps: true,
//   }
// );

// module.exports = mongoose.model("Order", orderSchema);












// const mongoose = require("mongoose");

// const orderSchema = new mongoose.Schema(
//   {
//     products: [
//       {
//         product: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Product",
//         },
//         count: Number,
//         color: String,
//       },
//     ],
//     paymentIntent: {
//       type: String,
//       required: true,
//       enum: ["Cash on Delivery", "PayPal", "Mobile Money"],
//     },
//     paypalOrderId: {
//       type: String,
//       required: function() {
//         return this.paymentIntent === "PayPal";
//       },
//     },
//     mobileMoneyTransactionId: {
//       type: String,
//       required: function() {
//         return this.paymentIntent === "Mobile Money";
//       },
//     },
//     orderStatus: {
//       type: String,
//       default: "Not Processed",
//       enum: [
//         "Not Processed",
//         "Processing",
//         "Dispatched",
//         "Cancelled",
//         "Delivered",
//       ],
//     },
//     dispatchTime: {
//       type: Date,
//     },
//     dispatchedAt: {
//       type: Date,
//     },
//     expectedDeliveryAt: {
//       type: Date,
//     },
//     deliveryConfirmed: {
//       type: Boolean,
//       default: false, 
//     },
//     orderby: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//     userDetails: {
//       email: String,
//       lastName: String,
//       address: String,
//       suite: String,
//       city: String,
//       country: String,
//       phone: String,
//     },
//     totalAmount: Number,
//   },
//   {
//     timestamps: true,
//   }
// );

// module.exports = mongoose.model("Order", orderSchema);








// const mongoose = require("mongoose");
// const shortid = require('shortid');

// // const orderSchema = new mongoose.Schema(
// //   {
// //     shortId: {
// //       type: String,
// //       unique: true,
// //       default: shortid.generate,
// //     },
// //     products: [
// //       {
// //         product: {
// //           type: mongoose.Schema.Types.ObjectId,
// //           ref: "Product",
// //         },
// //         count: Number,
// //         color: String,
// //       },
// //     ],
// //     paymentIntent: {
// //       type: String,
// //       required: true,
// //       enum: ["Cash on Delivery", "PayPal", "Mobile Money", "Stripe"],
// //       default: "Cash on Delivery" 
// //     },
// //     paypalOrderId: {
// //       type: String,
// //       // required: function () {
// //       //   return this.paymentIntent === "PayPal";
// //       // },
// //       required: false
// //     },
// //     stripeSessionId: {
// //       type: String,
// //       // required: function () {
// //       //   return this.paymentIntent === "Stripe"; 
// //       // },
// //     },
// //     mobileMoneyTransactionId: {
// //       type: String,
// //       // required: function () {
// //       //   return this.paymentIntent === "Mobile Money";
// //       // },
// //     },
// //     orderStatus: {
// //       type: String,
// //       default: "Pending",
// //       enum: [
// //         "Not Processed",
// //         "Pending",
// //         "Processing",
// //         "Dispatched",
// //         "Cancelled",
// //         "Delivered",
// //       ],
// //     },
// //     dispatchTime: {
// //       type: Date,
// //     },
// //     dispatchedAt: {
// //       type: Date,
// //     },
// //     expectedDeliveryAt: {
// //       type: Date,
// //     },
// //     deliveryConfirmed: {
// //       type: Boolean,
// //       default: false,
// //     },
// //     orderby: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: "User",
// //     },
// //     stripeSessionId: {
// //       type: String
// //     },
// //     userDetails: {
// //       email: String,
// //       name: String,
// //       address: String,
// //       postalCode: String,
// //       city: String,
// //       country: String,
// //       phone: String,
// //     },
// //     totalAmount: Number,
// //   },
// //   {
// //     timestamps: true,
// //   }
// // );

// // orderModel.js
// const orderSchema = new mongoose.Schema(
//   {
//     shortId: {
//       type: String,
//       unique: true,
//       default: shortid.generate,
//     },
//     products: [
//       {
//         product: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Product",
//           required: true
//         },
//         count: {
//           type: Number,
//           required: true
//         },
//         color: String,
//         price: {
//           type: Number,
//           required: true
//         }
//       },
//     ],
//     paymentIntent: {
//       type: String,
//       required: true,
//       enum: ["Cash on Delivery", "PayPal", "Mobile Money", "Stripe"],
//       default: "Cash on Delivery"
//     },
//     orderStatus: {
//       type: String,
//       default: "Pending",
//       enum: ["Pending", "Processing", "Dispatched", "Delivered", "Cancelled"],
//     },
//     orderby: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true
//     },
//     userDetails: {
//       email: String,
//       name: String,
//       address: String,
//       postalCode: String,
//       city: String,
//       country: String,
//       phone: String,
//     },
//     totalAmount: {
//       type: Number,
//       required: true
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// module.exports = mongoose.model("Order", orderSchema);















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
