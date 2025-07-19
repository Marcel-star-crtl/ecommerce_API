const Order = require("../models/orderModel");
const asyncHandler = require("express-async-handler");

const createOrder = asyncHandler(async (req, res) => {
  try {
    // Debugging logs
    console.log("User ID from request:", req.user?._id);
    console.log("Request body:", req.body);
    
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

    // Map payment method to valid enum values
    const paymentMethodMap = {
      'COD': 'Cash on Delivery',
      'Cash on Delivery': 'Cash on Delivery',
      'PayPal': 'PayPal',
      'Mobile Money': 'Mobile Money',
      'Stripe': 'Stripe',
      'cash': 'Cash on Delivery',
      'paypal': 'PayPal',
      'mobile': 'Mobile Money',
      'stripe': 'Stripe'
    };

    // Get the correct payment method or default to Cash on Delivery
    const validPaymentMethod = paymentMethodMap[paymentMethod] || 'Cash on Delivery';

    console.log("Original payment method:", paymentMethod);
    console.log("Mapped payment method:", validPaymentMethod);

    // Process products
    const processedProducts = products.map(item => ({
      product: item.productId,
      count: item.quantity || 1,
      color: item.color || 'default'
    }));

    // Create order object
    const orderData = {
      orderby: req.user._id,  
      products: processedProducts,
      paymentIntent: validPaymentMethod, // Use the mapped payment method
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

    console.log("Order data before save:", orderData);

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

// Get all orders for a user
const getUserOrders = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("Fetching orders for user:", userId);

    const orders = await Order.find({ orderby: userId })
      .populate({
        path: 'products.product',
        select: 'title price images description brand category'
      })
      .populate('orderby', 'firstname lastname email')
      .sort({ createdAt: -1 });

    console.log("Found orders:", orders.length);

    res.json({
      success: true,
      orders: orders,
      count: orders.length
    });

  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({
      message: "Failed to fetch orders",
      error: error.message
    });
  }
});

// Get single order by ID
const getOrderById = asyncHandler(async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({ 
      _id: orderId, 
      orderby: userId 
    })
    .populate({
      path: 'products.product',
      select: 'title price images description brand category'
    })
    .populate('orderby', 'firstname lastname email');

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    res.json({
      success: true,
      order: order
    });

  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      message: "Failed to fetch order",
      error: error.message
    });
  }
});

// Update order status (admin only)
const updateOrderStatus = asyncHandler(async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    const validStatuses = [
      "Not Processed",
      "Pending", 
      "Processing",
      "Dispatched",
      "Cancelled",
      "Delivered"
    ];

    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        message: "Invalid order status"
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { 
        orderStatus,
        ...(orderStatus === 'Dispatched' && { dispatchedAt: new Date() }),
        ...(orderStatus === 'Delivered' && { deliveryConfirmed: true })
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    res.json({
      success: true,
      message: "Order status updated successfully",
      order: order
    });

  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      message: "Failed to update order status",
      error: error.message
    });
  }
});

module.exports = {
  createOrder,
  getOrderById,
  getUserOrders,
  updateOrderStatus
};









// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// const Order = require("../models/orderModel");
// const asyncHandler = require("express-async-handler");

// const createCheckoutSession = asyncHandler(async (req, res) => {
//   try {
//     const { 
//       cartId, 
//       products, 
//       totalAmount, 
//       currency,
//       shippingAddress,
//       paymentMethod
//     } = req.body;

//     // Validate input
//     if (!cartId || !products || !totalAmount || !shippingAddress) {
//       return res.status(400).json({ message: "Invalid request data" });
//     }

//     // Create order in database first
//     const newOrder = new Order({
//       user: req.user._id,
//       cart: cartId,
//       products: products.map(item => ({
//         product: item.productId,
//         name: item.name,
//         image: item.image,
//         price: item.price,
//         quantity: item.quantity
//       })),
//       totalAmount: totalAmount,
//       paymentIntent: 'Stripe', // Explicitly set to Stripe
//       orderStatus: 'Pending',
//       stripeSessionId: '', // Will be updated after Stripe session creation
//       shippingAddress: {
//         firstName: shippingAddress.firstName,
//         lastName: shippingAddress.lastName,
//         email: shippingAddress.email,
//         phone: shippingAddress.phone,
//         address: shippingAddress.address,
//         city: shippingAddress.city,
//         country: shippingAddress.country,
//         postalCode: shippingAddress.postalCode
//       },
//       userDetails: {
//         email: req.user.email,
//         name: `${shippingAddress.firstName} ${shippingAddress.lastName}`
//       }
//     });

//     // Create Stripe checkout session
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       line_items: products.map(item => ({
//         price_data: {
//           currency: currency || 'usd',
//           product_data: {
//             name: item.name,
//             images: item.image ? [item.image] : []
//           },
//           unit_amount: Math.round(item.price * 100), // Convert to cents
//         },
//         quantity: item.quantity,
//       })),
//       mode: 'payment',
//       success_url: `${process.env.CLIENT_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${newOrder._id}`,
//       cancel_url: `${process.env.CLIENT_URL}/cart?canceled=true`,
//       customer_email: shippingAddress.email,
//       metadata: {
//         orderId: newOrder._id.toString(),
//         userId: req.user._id.toString(),
//         cartId: cartId
//       }
//     });

//     // Update order with Stripe session ID
//     newOrder.stripeSessionId = session.id;
//     await newOrder.save();

//     res.json({ 
//       url: session.url, 
//       orderId: newOrder._id,
//       amount: totalAmount
//     });
//   } catch (error) {
//     console.error("Payment error:", error);
//     res.status(500).json({ 
//       message: "Payment processing failed",
//       error: error.message 
//     });
//   }
// });

// module.exports = {
//   createCheckoutSession
// };


