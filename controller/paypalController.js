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
    // Construct the request body for creating the order
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

    // Make the API call to create the order
    const response = await client.execute(request);

    // Extract the order ID from the response
    const orderId = response.result.id;

    // Return the order ID to the client
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

    // Construct the request body for capturing the order
    const request = new paypal.orders.OrdersCaptureRequest(orderId);

    // Make the API call to capture the order
    const response = await client.execute(request);

    // Extract relevant information from the response
    const captureId = response.result.purchase_units[0].payments.captures[0].id;

    // Return the capture ID to the client
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

