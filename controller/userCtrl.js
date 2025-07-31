const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");
const Order = require("../models/orderModel");
const uniqid = require("uniqid");
const paypal = require('@paypal/checkout-server-sdk');
const { paypalClient } = require("../config/paypalConfig");

const express = require('express');
const sendSMS = require('../utils/smsService');
const axios = require('axios');


// const asyncHandler = require("express-async-handler");
const asyncHandler = require("express-async-handler");
const { generateToken } = require("../config/jwtToken");
const validateMongoDbId = require("../utils/validateMongodbId");
const { generateRefreshToken } = require("../config/refreshtoken");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const sendEmail = require("./emailCtrl");

const dotenv = require('dotenv');
dotenv.config()


const createUser = asyncHandler(async (req, res) => {
  const { firstname, lastname, email, mobile, password } = req.body;

  if (!firstname || !lastname || !email || !password) {
    return res.status(400).json({ message: "Please provide all required fields." });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: "User already exists." });
  }

  const userData = {
    firstname,
    lastname,
    email,
    password
  };

  if (mobile && mobile.trim()) {
    userData.mobile = mobile.trim();
  }

  // Create user
  const newUser = await User.create(userData);
  
  res.status(201).json({
    _id: newUser._id,
    firstname: newUser.firstname,
    lastname: newUser.lastname,
    email: newUser.email,
    mobile: newUser.mobile,
    role: newUser.role,
    createdAt: newUser.createdAt,
  });
});

// Login a user
const loginUserCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // check if user exists or not
  const findUser = await User.findOne({ email });
  if (findUser && (await findUser.isPasswordMatched(password))) {
    const refreshToken = await generateRefreshToken(findUser?._id);
    const updateuser = await User.findByIdAndUpdate(
      findUser.id,
      {
        refreshToken: refreshToken,
      },
      { new: true }
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
    res.json({
      _id: findUser?._id,
      firstname: findUser?.firstname,
      lastname: findUser?.lastname,
      email: findUser?.email,
      mobile: findUser?.mobile,
      token: generateToken(findUser?._id),
    });
  } else {
    throw new Error("Invalid Credentials");
  }
});


// admin login
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // check if user exists or not
  const findAdmin = await User.findOne({ email });
  if (findAdmin.role !== "admin") throw new Error("Not Authorised");
  if (findAdmin && (await findAdmin.isPasswordMatched(password))) {
    const refreshToken = await generateRefreshToken(findAdmin?._id);
    const updateuser = await User.findByIdAndUpdate(
      findAdmin.id,
      {
        refreshToken: refreshToken,
      },
      { new: true }
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
    res.json({
      _id: findAdmin?._id,
      firstname: findAdmin?.firstname,
      lastname: findAdmin?.lastname,
      email: findAdmin?.email,
      mobile: findAdmin?.mobile,
      token: generateToken(findAdmin?._id),
    });
  } else {
    throw new Error("Invalid Credentials");
  }
});


// handle refresh token
const handleRefreshToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (!user) throw new Error(" No Refresh token present in db or not matched");
  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err || user.id !== decoded.id) {
      throw new Error("There is something wrong with refresh token");
    }
    const accessToken = generateToken(user?._id);
    res.json({ accessToken });
  });
});


// logout functionality
const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
  
  const refreshToken = cookie.refreshToken;
  
  // Check if user exists with the provided refreshToken
  const user = await User.findOne({ refreshToken });
  if (!user) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
    });
    return res.sendStatus(403);
  }

  await User.findOneAndUpdate({ refreshToken }, { refreshToken: "" });
  
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
  });
  res.sendStatus(204); 
});


// Update a user
const updatedUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);

  try {
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      {
        firstname: req?.body?.firstname,
        lastname: req?.body?.lastname,
        email: req?.body?.email,
        mobile: req?.body?.mobile,
      },
      {
        new: true,
      }
    );
    res.json(updatedUser);
  } catch (error) {
    throw new Error(error);
  }
});


// save user Address
const saveAddress = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  validateMongoDbId(_id);

  try {
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      {
        address: req?.body?.address,
      },
      {
        new: true,
      }
    );
    res.json(updatedUser);
  } catch (error) {
    throw new Error(error);
  }
});


// Get all users
const getallUser = asyncHandler(async (req, res) => {
  try {
    const getUsers = await User.find().populate("wishlist");
    res.json(getUsers);
  } catch (error) {
    throw new Error(error);
  }
});


// Get a single user
const getaUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const getaUser = await User.findById(id);
    res.json({
      getaUser,
    });
  } catch (error) {
    throw new Error(error);
  }
});


// Get a single user
const deleteaUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const deleteaUser = await User.findByIdAndDelete(id);
    res.json({
      deleteaUser,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const blockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const blockusr = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: true,
      },
      {
        new: true,
      }
    );
    res.json(blockusr);
  } catch (error) {
    throw new Error(error);
  }
});

const unblockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const unblock = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: false,
      },
      {
        new: true,
      }
    );
    res.json({
      message: "User UnBlocked",
    });
  } catch (error) {
    throw new Error(error);
  }
});

const updatePassword = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { password } = req.body;
  validateMongoDbId(_id);
  const user = await User.findById(_id);
  if (password) {
    user.password = password;
    const updatedPassword = await user.save();
    res.json(updatedPassword);
  } else {
    res.json(user);
  }
});


const forgotPasswordToken = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found with this email");

  try {
    const token = await user.createPasswordResetToken();
    await user.save();
    const resetURL = `${process.env.FRONTEND_URL}/(auth)/reset-password?token=${token}`;
    const message = `
      <p>Hi,</p>
      <p>Please follow this link to reset your password. This link is valid for 10 minutes from now:</p>
      <p><a href="${resetURL}">Click here to reset your password</a></p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    const data = {
      to: email,
      text: "Hey User",
      subject: "Forgot Password Link",
      html: message,
    };

    sendEmail(data);
    res.json(token);
  } catch (error) {
    throw new Error(error);
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) throw new Error("Token Expired, Please try again later");
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.json({ success: true, message: "Password reset successfully" });
});

// controllers/userCtrl.js
const getWishlist = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  try {
    const user = await User.findById(_id).populate({
      path: "wishlist",
      populate: {
        path: "images",
        select: "image"
      }
    });
    
    const formattedWishlist = user.wishlist.map(item => ({
      id: item._id,
      name: item.title,
      description: item.description,
      price: item.price,
      quantity: item.quantity,
      images: item.images,
      itemNumber: item.itemNumber,
      size: item.size || 'N/A'
    }));

    res.json({
      success: true,
      products: formattedWishlist,
      count: formattedWishlist.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wishlist',
      error: error.message
    });
  }
});

const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id; 

    // Find the user by userId
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if productId is already in the wishlist
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    // Add productId to wishlist
    user.wishlist.push(productId);
    await user.save();

    res.status(200).json(user);
  } catch (error) {
    console.error('[addToWishlist]', error.message);
    res.status(500).json({ message: 'Failed to update wishlist' });
  }
};


const deleteWishlistItem = async (req, res) => {
  try {
    const { productId } = req.body; 
    const userId = req.user.id; 

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.wishlist.includes(productId)) {
      return res.status(400).json({ message: 'Product not found in wishlist' });
    }

    user.wishlist = user.wishlist.filter(id => id.toString() !== productId.toString());
    await user.save();

    res.status(200).json(user);
  } catch (error) {
    console.error('[deleteWishlistItem]', error.message);
    res.status(500).json({ message: 'Failed to update wishlist' });
  }
};



// userCtrl.js (cart endpoint)
const userCart = asyncHandler(async (req, res) => {
  console.log('\n=== NEW CART REQUEST ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  console.log('Raw Body:', req.body);
  console.log('User:', req.user);
  
  const { _id } = req.user;
  validateMongoDbId(_id);
  
  try {
    console.log('Finding user...');
    const user = await User.findById(_id);
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: "User not found" });
    }
    
    let productsToAdd = [];
    console.log('Processing request body...');
    
    if (req.body.product_id && req.body.quantity) {
      console.log('New format detected - single product');
      let { product_id, quantity, color = "default" } = req.body;
      
      if (Array.isArray(color)) {
        color = color[0] || "default";
      }
      
      console.log('Finding product:', product_id);
      const productDetails = await Product.findById(product_id);
      if (!productDetails) {
        console.log('Product not found with ID:', product_id);
        return res.status(404).json({ 
          message: "Product not found",
          product_id: product_id
        });
      }
      
      productsToAdd.push({
        product: product_id,
        count: quantity,
        color: color,
        price: productDetails.price
      });
    } else if (req.body.cart && req.body.cart.products) {
      console.log('Old format detected - cart with products array');
      const { cart } = req.body;
      for (let i = 0; i < cart.products.length; i++) {
        let productItem = cart.products[i];
        console.log('Processing product:', productItem.product);
        
        if (Array.isArray(productItem.color)) {
          productItem.color = productItem.color[0] || "default";
        }
        
        const productDetails = await Product.findById(productItem.product);
        if (!productDetails) {
          console.log('Product not found with ID:', productItem.product);
          continue;
        }
        
        productsToAdd.push({
          product: productItem.product,
          count: productItem.count,
          color: productItem.color || "default",
          price: productDetails.price
        });
      }
    } else {
      console.log('Invalid request format:', req.body);
      return res.status(400).json({ 
        message: "Invalid request format",
        expectedFormats: [
          { 
            product_id: "String (required)", 
            quantity: "Number (required)", 
            color: "String (optional)" 
          },
          { 
            cart: { 
              products: [
                { 
                  product: "String (required)", 
                  count: "Number (required)", 
                  color: "String (optional)" 
                }
              ] 
            } 
          }
        ]
      });
    }

    console.log('Checking for existing cart...');
    let existingCart = await Cart.findOne({ orderby: user._id })
      .populate('products.product');

    if (existingCart) {
      console.log('Existing cart found:', existingCart);
      for (const newProduct of productsToAdd) {
        const existingProductIndex = existingCart.products.findIndex(
          p => p.product._id.toString() === newProduct.product.toString() && 
               p.color === newProduct.color
        );

        if (existingProductIndex > -1) {
          console.log('Product exists in cart, updating quantity');
          existingCart.products[existingProductIndex].count += newProduct.count;
        } else {
          console.log('Adding new product to cart');
          existingCart.products.push(newProduct);
        }
      }

      let cartTotal = 0;
      existingCart.products.forEach(p => {
        cartTotal += p.price * p.count;
      });
      existingCart.cartTotal = cartTotal;
      
      console.log('Saving updated cart...');
      existingCart = await existingCart.save();
      
      console.log('Cart updated successfully');
      return res.json({
        success: true,
        message: "Product(s) added successfully",
        cart: existingCart
      });
    } else {
      console.log('No existing cart, creating new one');
      let cartTotal = 0;
      productsToAdd.forEach(p => {
        cartTotal += p.price * p.count;
      });

      const newCart = await new Cart({
        products: productsToAdd,
        cartTotal,
        orderby: user._id,
      }).save();
      
      console.log('New cart created successfully');
      return res.json({
        success: true,
        message: "Cart created with product(s)",
        cart: newCart
      });
    }
  } catch (error) {
    console.error('\n=== CART CONTROLLER ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    console.error('Request Body:', req.body);
    
    return res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});


const getUserCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const cart = await Cart.findOne({ orderby: _id }).populate(
      "products.product"
    );
    res.json(cart);
  } catch (error) {
    throw new Error(error);
  }
});

const emptyCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const user = await User.findOne({ _id });
    const cart = await Cart.findOneAndDelete({ orderby: user._id });
    res.json(cart);
  } catch (error) {
    throw new Error(error);
  }
});

const applyCoupon = asyncHandler(async (req, res) => {
  const { coupon } = req.body;
  const { _id } = req.user;
  validateMongoDbId(_id);
  const validCoupon = await Coupon.findOne({ name: coupon });
  if (validCoupon === null) {
    throw new Error("Invalid Coupon");
  }
  const user = await User.findOne({ _id });
  let { cartTotal } = await Cart.findOne({
    orderby: user._id,
  }).populate("products.product");
  let totalAfterDiscount = (
    cartTotal -
    (cartTotal * validCoupon.discount) / 100
  ).toFixed(2);
  await Cart.findOneAndUpdate(
    { orderby: user._id },
    { totalAfterDiscount },
    { new: true }
  );
  res.json(totalAfterDiscount);
});


const updateCartQuantity = asyncHandler(async (req, res) => {

  const { _id: userId } = req.user;
  const { action, product: productId } = req.body; 
  validateMongoDbId(userId);

  try {
    const cart = await Cart.findOne({ orderby: userId }).populate('products.product');

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const productIndex = cart.products.findIndex(
      (item) => item.product._id.toString() === productId.toString()
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    const cartItem = cart.products[productIndex];

    if (action === "INCREASE") {
      const productDoc = await Product.findById(productId);
      if (!productDoc || productDoc.quantity < (cartItem.count + 1)) {
        return res.status(400).json({ message: "Insufficient product stock." });
      }
      cartItem.count++;
    } else if (action === "DECREASE") {
      if (cartItem.count > 1) {
        cartItem.count--;
      } else {
        cart.products.splice(productIndex, 1);
      }
    } else {
      return res.status(400).json({ message: "Invalid action. Use 'INCREASE' or 'DECREASE'." });
    }

    let cartTotal = 0;
    for (const item of cart.products) {
      const productData = await Product.findById(item.product._id); 
      if (productData) {
         cartTotal += productData.price * item.count;
      } else {
         console.warn(`Product with ID ${item.product._id} not found for cart total calculation.`);
      }
    }
    cart.cartTotal = cartTotal;

    const updatedCart = await cart.save();

    const finalCart = await Cart.findById(updatedCart._id).populate('products.product');

    console.log('Cart updated successfully:', finalCart);
    res.json({
      message: "Cart quantity updated successfully",
      cart: finalCart, 
      product: finalCart.products.find(item => item.product._id.toString() === productId.toString())
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});


// New controller for deleting a specific cart item
const deleteCartItem = asyncHandler(async (req, res) => {

  const { _id: userId } = req.user;
  const { id: productIdToDelete } = req.params; 

  validateMongoDbId(userId);
  validateMongoDbId(productIdToDelete);

  try {
    const cart = await Cart.findOne({ orderby: userId }).populate('products.product');

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const initialProductCount = cart.products.length;
    cart.products = cart.products.filter(
      (item) => item.product._id.toString() !== productIdToDelete.toString()
    );

    if (cart.products.length === initialProductCount) {
      return res.status(404).json({ message: "Product not found in cart." });
    }

    let cartTotal = 0;
    for (const item of cart.products) {
      const productData = await Product.findById(item.product._id);
      if (productData) {
        cartTotal += productData.price * item.count;
      } else {
        console.warn(`Product with ID ${item.product._id} not found for cart total calculation after deletion.`);
      }
    }
    cart.cartTotal = cartTotal;

    const updatedCart = await cart.save();

    const finalCart = await Cart.findById(updatedCart._id).populate('products.product');


    res.json({
      message: "Product removed from cart successfully",
      cart: finalCart
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});


const createOrder = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const user = await User.findById(_id);

    const userCart = await Cart.findOne({ orderby: user._id }).populate("products.product");

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: userCart.totalAfterDiscount ? userCart.totalAfterDiscount : userCart.cartTotal
        }
      }]
    });

    const response = await client.execute(request);

    const orderId = response.result.id;

    const approvalUrl = response.result.links.find(link => link.rel === 'approve').href;

    res.json({ orderId, approvalUrl });
  } catch (error) {
    throw new Error(error);
  }
});


const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ orderby: req.user._id })
    .populate('products.product')
    .lean();  

  console.log("Orders being sent:", orders); 
  res.json({ orders });
});


const getAllOrders = asyncHandler(async (req, res) => {
  try {
    const alluserorders = await Order.find()
      .populate("products.product")
      .populate("orderby")
      .exec();
    res.json(alluserorders);
  } catch (error) {
    throw new Error(error);
  }
});

const getOrderByUserId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const userOrders = await Order.find({ orderby: id })
      .populate("products.product")
      .populate("orderby")
      .exec();
    res.json(userOrders);
  } catch (error) {
    throw new Error(error);
  }
});


const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId, status, dispatchedAt, expectedDeliveryAt } = req.body;

  console.log('Received update request:', { orderId, status, dispatchedAt, expectedDeliveryAt });

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

    res.status(200).json({ 
      message: "Order status updated successfully", 
      order: updatedOrder,
      orderId: updatedOrder._id,
      status: updatedOrder.orderStatus,
      dispatchedAt: updatedOrder.dispatchedAt,
      expectedDeliveryAt: updatedOrder.expectedDeliveryAt
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status', error: error.toString() });
  }
});


const initiateOrderConfirmation = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  
  try {
    const order = await Order.findById(orderId);
    if (!order || order.orderby.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const confirmationCode = crypto.randomInt(100000, 999999).toString();
    const codeExpiry = new Date(Date.now() + 15*60*1000); 

    order.confirmationCode = confirmationCode;
    order.codeExpiry = codeExpiry;
    await order.save();

    const smsSent = await sendSMS(order.userDetails.phone, confirmationCode);
    if (smsSent) {
      res.status(200).json({ message: "Confirmation code sent" });
    } else {
      res.status(500).json({ message: "Failed to send confirmation code" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});


const confirmOrderReceipt = asyncHandler(async (req, res) => {
  const { orderId, confirmationCode } = req.body;

  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (order.orderby.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  if (!order.confirmationCode || order.confirmationCode !== confirmationCode) {
    return res.status(400).json({ message: "Invalid confirmation code" });
  }

  if (!order.codeExpiry || new Date() > order.codeExpiry) {
    return res.status(400).json({ message: "Confirmation code expired" });
  }

  order.orderStatus = "Delivered";
  order.confirmationCode = undefined;
  order.codeExpiry = undefined;
  await order.save();

  res.status(200).json({ message: "Order receipt confirmed", order });
});


const confirmDelivery = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { 
        deliveryConfirmed: true, 
        orderStatus: 'Delivered',
        deliveredAt: new Date()
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ 
      message: "Order marked as delivered", 
      order: updatedOrder,
      orderId: updatedOrder._id,
      deliveryConfirmed: updatedOrder.deliveryConfirmed,
      deliveredAt: updatedOrder.deliveredAt
    });
  } catch (error) {
    console.error('Error confirming delivery:', error);
    res.status(500).json({ message: 'Error confirming delivery', error: error.toString() });
  }
});



module.exports = {
  createUser,
  loginUserCtrl,
  getallUser,
  getaUser,
  deleteaUser,
  updatedUser,
  blockUser,
  unblockUser,
  handleRefreshToken,
  logout,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
  loginAdmin,
  getWishlist,
  saveAddress,
  userCart,
  getUserCart,
  emptyCart,
  updateCartQuantity, 
  deleteCartItem,
  applyCoupon,
  createOrder,
  getOrders,
  updateOrderStatus,
  getAllOrders,
  getOrderByUserId,
  addToWishlist,
  deleteWishlistItem,
  confirmDelivery,
  initiateOrderConfirmation,
  confirmOrderReceipt,
  // initiateMobileMoneyPayment
};



