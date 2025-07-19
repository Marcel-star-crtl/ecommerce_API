require('dotenv').config();
const express = require('express');
const asyncHandler = require("express-async-handler");
const paypal = require("@paypal/checkout-server-sdk");
const Order = require("../models/orderModel");
const { paypalClient } = require("../config/paypalConfig");
const crypto = require('crypto');
const sendSMS = require('../utils/smsService');
const axios = require('axios');
const socketManager = require("../socketManager");
const shortMongoId = require('short-mongo-id');

// Helper function to calculate total amount
const calculateTotalAmount = (cartItems) => {
  return cartItems.reduce(
    (acc, cartItem) => acc + cartItem.item.price * cartItem.quantity,
    0
  ).toFixed(2);
};

// Helper function to generate a unique transaction reference
const generateUniqueTransactionRef = () => {
  return 'txn-' + Math.random().toString(36).substr(2, 9);
};


// Controller to create an order
// const createOrder = asyncHandler(async (req, res) => {
//   try {
//     const { cartItems, userDetails, paymentMethod, totalPrice } = req.body;

//     if (!cartItems || !userDetails || !paymentMethod || !totalPrice) {
//       return res.status(400).json({ message: "Invalid order data" });
//     }

//     let paymentIntent = "Cash on Delivery";
//     let paypalOrderId = null;
//     let mobileMoneyTransactionId = null;
//     let paymentAuthUrl = null;

//     if (paymentMethod === 'PayPal') {
//       try {
//         const request = new paypal.orders.OrdersCreateRequest();
//         request.prefer("return=representation");
//         request.requestBody({
//           intent: 'CAPTURE',
//           purchase_units: [{
//             amount: {
//               currency_code: 'USD',
//               value: totalPrice.toString()
//             }
//           }]
//         });

//         const order = await paypalClient().execute(request);
//         paypalOrderId = order.result.id;
//         paymentIntent = "PayPal";
//         paymentAuthUrl = `https://www.paypal.com/checkoutnow?token=${paypalOrderId}`;
//       } catch (paypalError) {
//         return res.status(500).json({ message: "Failed to create PayPal order", error: paypalError.toString() });
//       }
//     } else if (paymentMethod === 'Mobile Money') {
//       try {
//         const mobileMoneyResponse = await initiateMobileMoneyPayment(totalPrice, userDetails.phone);
//         mobileMoneyTransactionId = mobileMoneyResponse.transactionId;
//         paymentIntent = "Mobile Money";
//         paymentAuthUrl = mobileMoneyResponse.paymentAuthUrl;
//       } catch (mobileMoneyError) {
//         return res.status(500).json({ message: "Failed to initiate Mobile Money payment", error: mobileMoneyError.toString() });
//       }
//     }

//     const newOrder = new Order({
//       products: cartItems.map((cartItem) => ({
//         product: cartItem.item._id,
//         count: cartItem.quantity,
//         color: cartItem.color,
//       })),
//       paymentIntent,
//       paypalOrderId,
//       mobileMoneyTransactionId,
//       orderby: req.user._id,
//       userDetails: {
//         email: userDetails.email,
//         name: userDetails.name,
//         address: userDetails.address,
//         postalCode: userDetails.postalCode,
//         city: userDetails.city,
//         country: userDetails.country,
//         phone: userDetails.phone,
//       },
//       orderStatus: 'Not Processed',
//       totalAmount: totalPrice,
//     });

//     await newOrder.save();

//     socketManager.emitNewOrder(newOrder._id, newOrder.orderStatus);

//     res.status(201).json({
//       orderId: newOrder._id,
//       clientId: process.env.PAYPAL_CLIENT_ID,
//       paymentIntent,
//       paypalOrderId,
//       mobileMoneyTransactionId,
//       paymentAuthUrl,
//     });
//   } catch (error) {
//     console.error("Detailed error:", error);
//     res.status(500).json({ message: 'Error creating order', error: error.toString() });
//   }
// });

const createOrder = asyncHandler(async (req, res) => {
  try {
    // Debugging logs
    console.log("User ID from request:", req.user?._id);
    
    const { 
      cartId, 
      products, 
      totalAmount, 
      shippingAddress,
      paymentMethod = 'Cash on Delivery'
    } = req.body;

    // Validate input
    if (!cartId || !products || !totalAmount || !shippingAddress) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    if (!req.user?._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Process products
    const processedProducts = products.map(item => ({
      product: item.productId,
      count: item.quantity || 1,
      color: item.color || 'default'
    }));

    // Create order object
    const orderData = {
      orderby: req.user._id,  // Make sure this is set
      products: processedProducts,
      paymentIntent: paymentMethod,
      totalAmount: totalAmount,
      orderStatus: 'Pending',
      userDetails: {
        email: shippingAddress.email || req.user.email,
        name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        address: shippingAddress.address,
        city: shippingAddress.city,
        country: shippingAddress.country,
        postalCode: shippingAddress.postalCode,
        phone: shippingAddress.phone
      }
    };

    // Create and save order
    const newOrder = new Order(orderData);
    await newOrder.save();

    res.json({ 
      success: true,
      orderId: newOrder._id,
      message: "Order created successfully"
    });

  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ 
      message: "Order creation failed",
      error: error.message 
    });
  }
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId, status, dispatchedAt, expectedDeliveryAt } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  if (!status) {
    return res.status(400).json({ message: "Status is required" });
  }

  try {
    const updateData = { orderStatus: status };

    if (status === 'Dispatched') {
      updateData.dispatchedAt = dispatchedAt || new Date();
      updateData.expectedDeliveryAt = expectedDeliveryAt || new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    const io = socketManager.getIO();
    io.emit("orderStatusUpdate", { 
      orderId: updatedOrder._id, 
      status: updatedOrder.orderStatus,
      dispatchedAt: updatedOrder.dispatchedAt,
      expectedDeliveryAt: updatedOrder.expectedDeliveryAt
    });

    res.status(200).json({ 
      message: "Order status updated successfully", 
      orderId: updatedOrder._id,
      status: updatedOrder.orderStatus,
      dispatchedAt: updatedOrder.dispatchedAt,
      expectedDeliveryAt: updatedOrder.expectedDeliveryAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status', error: error.toString() });
  }
});


// Controller to capture PayPal order
const captureOrder = asyncHandler(async (req, res) => {
  const { orderId, paypalOrderId } = req.body;

  if (!orderId || !paypalOrderId) {
    return res.status(400).json({ message: "Invalid order data" });
  }

  try {
    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({});

    const capture = await paypalClient().execute(request);
    
    // Update order status in the database
    await Order.findByIdAndUpdate(orderId, { 
      orderStatus: 'Processing',
      paymentStatus: 'Paid'
    });

    res.status(200).json({ message: "Order captured successfully", captureId: capture.result.id });
  } catch (error) {
    res.status(500).json({ message: 'Error capturing order', error: error.toString() });
  }
});


// orderController.js
const getOrders = asyncHandler(async (req, res) => {
  try {
    // Disable caching
    res.setHeader('Cache-Control', 'no-store');
    
    const userId = req.user._id;
    console.log(`Fetching orders for user: ${userId}`);

    // Find orders with proper population
    const orders = await Order.find({ orderby: userId })
      .populate({
        path: 'products.product',
        select: 'name price images description' // Only select necessary fields
      })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Found ${orders.length} orders for user ${userId}`);

    if (orders.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No orders found",
        orders: []
      });
    }

    // Enhance orders with shortId
    const enhancedOrders = orders.map(order => ({
      ...order,
      shortId: order.shortId || shortMongoId(order._id)
    }));

    return res.status(200).json({
      success: true,
      count: enhancedOrders.length,
      orders: enhancedOrders
    });

  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message
    });
  }
});

const getSingleOrder = asyncHandler(async (req, res) => {
  const shortId = req.params.id;

  if (!shortId) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  try {
    const orders = await Order.find().populate('products.product').lean();
    const order = orders.find(o => shortMongoId(o._id) === shortId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ order: { ...order, shortId } });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order', error: error.toString() });
  }
});

// Controller to confirm delivery
const confirmDelivery = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus: 'Delivered' },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ 
      message: "Order marked as delivered", 
      orderId: updatedOrder._id,
      status: updatedOrder.orderStatus
    });
  } catch (error) {
    res.status(500).json({ message: 'Error confirming delivery', error: error.toString() });
  }
});

// Controller to initiate order confirmation
const initiateOrderConfirmation = asyncHandler(async (req, res) => {
  const { orderId, phoneNumber, expectedDeliveryAt } = req.body;

  if (!orderId || !phoneNumber || !expectedDeliveryAt) {
    return res.status(400).json({ message: "Invalid data" });
  }

  try {
    const message = `Dear customer, your order with ID: ${orderId} has been dispatched and is expected to be delivered on ${expectedDeliveryAt}. Please confirm receipt by replying to this message.`;

    await sendSMS(phoneNumber, message);

    res.status(200).json({ message: 'Order confirmation initiated', orderId });
  } catch (error) {
    res.status(500).json({ message: 'Error initiating order confirmation', error: error.toString() });
  }
});

// Controller to confirm order receipt
const confirmOrderReceipt = asyncHandler(async (req, res) => {
  const { orderId, confirmed } = req.body;

  if (!orderId || typeof confirmed === 'undefined') {
    return res.status(400).json({ message: "Invalid data" });
  }

  try {
    const updateData = confirmed ? { orderStatus: 'Received' } : { orderStatus: 'Delivery Failed' };

    const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, { new: true });

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ 
      message: `Order marked as ${confirmed ? 'received' : 'delivery failed'}`, 
      orderId: updatedOrder._id,
      status: updatedOrder.orderStatus
    });
  } catch (error) {
    res.status(500).json({ message: 'Error confirming order receipt', error: error.toString() });
  }
});

// Controller for handling mobile money payment callback
const mobileMoneyCallback = asyncHandler(async (req, res) => {
  const { transactionId, status, message } = req.body;

  if (!transactionId || !status) {
    return res.status(400).json({ message: "Invalid data" });
  }

  try {
    const order = await Order.findOne({ mobileMoneyTransactionId: transactionId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    let updatedStatus = '';
    let paymentStatus = '';

    if (status === 'SUCCESSFUL') {
      updatedStatus = 'Processing';
      paymentStatus = 'Paid';
    } else if (status === 'FAILED') {
      updatedStatus = 'Failed';
      paymentStatus = 'Failed';
    } else {
      updatedStatus = 'Pending';
      paymentStatus = 'Pending';
    }

    order.orderStatus = updatedStatus;
    order.paymentStatus = paymentStatus;
    await order.save();

    res.status(200).json({ message: "Order status updated", orderId: order._id, status: updatedStatus, paymentStatus });
  } catch (error) {
    res.status(500).json({ message: 'Error handling mobile money callback', error: error.toString() });
  }
});

const getTotalIncome = asyncHandler(async (req, res) => {
  try {
    const totalIncome = await Order.aggregate([
      {
        $match: { orderStatus: 'Delivered' } 
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }
        }
      }
    ]);

    const totalIncomeValue = totalIncome.length > 0 ? totalIncome[0].total : 0;

    res.status(200).json({ totalIncome: totalIncomeValue });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating total income', error: error.toString() });
  }
});


const getMonthlyIncome = asyncHandler(async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const monthlyIncome = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(`${currentYear}-01-01`), $lte: new Date(`${currentYear}-12-31`) },
          orderStatus: 'Delivered'
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalAmount: { $sum: "$totalAmount" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedData = monthNames.map((month, index) => ({
      type: month,
      sales: monthlyIncome.find(item => item._id === index + 1)?.totalAmount || 0
    }));

    res.status(200).json(formattedData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching monthly income', error: error.toString() });
  }
});

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('products.product'); 
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order' });
  }
};


module.exports = {
  createOrder,
  captureOrder,
  getOrders,
  updateOrderStatus,
  initiateOrderConfirmation,
  confirmOrderReceipt,
  mobileMoneyCallback,
  confirmDelivery,
  getTotalIncome,
  getSingleOrder,
  getMonthlyIncome,
  getOrderById
};
