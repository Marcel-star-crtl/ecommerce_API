const paypal = require('@paypal/checkout-server-sdk');
const dotenv = require('dotenv');
dotenv.config();

// Retrieve PayPal credentials from environment variables
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

// Set up PayPal environment
const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
const client = new paypal.core.PayPalHttpClient(environment);

// Function to create PayPal order
const createOrder = async (req, res) => {
  try {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: '10.00' 
        }
      }]
    });

    const response = await client.execute(request);

    const orderId = response.result.id;

    res.json({ orderId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create PayPal order' });
  }
};

// Function to capture PayPal order
const capturePayment = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const request = new paypal.orders.OrdersCaptureRequest(orderId);

    const response = await client.execute(request);

    const captureId = response.result.purchase_units[0].payments.captures[0].id;

    res.json({ captureId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to capture PayPal order' });
  }
};

module.exports = {
    createOrder,
    capturePayment
};

