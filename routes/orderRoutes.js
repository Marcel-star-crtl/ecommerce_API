const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const { createOrder, getUserOrders, getOrderById, updateOrderStatus } = require("../controller/paymentController");
const {  
  captureOrder, 
  getOrders, 
  // updateOrderStatus,
  initiateOrderConfirmation,
  confirmOrderReceipt,
  mobileMoneyCallback,
  confirmDelivery,
  getTotalIncome,
  getSingleOrder,
  getMonthlyIncome
} = require("../controller/orderController");

router.post("/create-order", authMiddleware, createOrder);
router.post("/capture-order", authMiddleware, captureOrder);
router.get("/get-orders", authMiddleware, getOrders);
router.get("/get-orders/:id", authMiddleware, getSingleOrder);
router.post("/mobile-money-callback", mobileMoneyCallback);
// router.put("/update-order-status", authMiddleware, updateOrderStatus);
router.post("/initiate-confirmation", authMiddleware, initiateOrderConfirmation);
router.post("/confirm-delivery", authMiddleware, confirmDelivery);
router.post('/confirm-receipt', authMiddleware, confirmOrderReceipt);
router.get("/gettotalincome", authMiddleware, getTotalIncome);
router.get("/monthly-income", authMiddleware, getMonthlyIncome);
router.get('/getOrderById/:id', getOrderById);



router.get('/user-orders', authMiddleware, getUserOrders);
router.get('/:orderId', authMiddleware, getOrderById);
router.put('/:orderId/status', authMiddleware, updateOrderStatus);


module.exports = router;
