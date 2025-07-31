const express = require('express');
const {
    createOrder,
    capturePayment
} = require ("../controller/paypalController");
const { isAmin, authMiddleware } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/create-order', authMiddleware, createOrder);

router.post('/capture-payment', authMiddleware, capturePayment);

module.exports = router;
