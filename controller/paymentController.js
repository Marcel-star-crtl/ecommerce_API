const Order = require("../models/orderModel");
const asyncHandler = require("express-async-handler");

const createOrder = asyncHandler(async (req, res) => {
  try {
    const { 
      cartId, 
      products, 
      totalAmount, 
      shippingAddress
    } = req.body;

    // Validate input
    if (!cartId || !products || !totalAmount || !shippingAddress) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // Create COD order in database
    const newOrder = new Order({
      user: req.user._id,
      cart: cartId,
      products: products.map(item => ({
        product: item.productId,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity
      })),
      totalAmount: totalAmount,
      paymentIntent: 'Cash on Delivery', 
      orderStatus: 'Pending',
      shippingAddress: {
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        email: shippingAddress.email,
        phone: shippingAddress.phone,
        address: shippingAddress.address,
        city: shippingAddress.city,
        country: shippingAddress.country,
        postalCode: shippingAddress.postalCode
      },
      userDetails: {
        email: req.user.email,
        name: `${shippingAddress.firstName} ${shippingAddress.lastName}`
      }
    });

    await newOrder.save();

    res.json({ 
      success: true,
      orderId: newOrder._id,
      message: "Cash on Delivery order created successfully"
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ 
      message: "Order creation failed",
      error: error.message 
    });
  }
});

module.exports = {
  createOrder
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


