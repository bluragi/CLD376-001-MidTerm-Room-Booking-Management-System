const express = require('express');
const axios = require('axios');
const app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json())
app.use(express.json());

const PAYMENT_SERVICE_URL = 'http://localhost:5005/paymentprocess';
const NOTIFICATION_SERVICE_URL = 'http://localhost:5006/sendnotification';

// Booking
app.post('/bookroom', async (req, res) => {
    try {
    //Call Payment Service
    const paymentResponse = await axios.post(PAYMENT_SERVICE_URL, req.body);
    const { status } = paymentResponse.data;

    //Call Notification Service based on payment result
    const notifMessage = status === 'Success'
                                ? 'Your booking has been completed successfully!'
                                : 'Your booking could not be completed due to payment failure.';

    await axios.post(NOTIFICATION_SERVICE_URL, {
        status: status,
        message: notifMessage
    });

    // Respond to the user
    res.json({
        orderStatus: status,
        message: `Booking processed. Payment ${status}. Notification sent.`
    });

    } catch (error) {
        res.status(500).json({ error: 'Booking processing failed', details: error.message });
    }
});

// View Booking Details
app.get('/viewbooking', (req, res) => {
    res.send('VIEWING BOOKING ROOM DETAILS...');
});

// Cancel Booking
app.delete('/cancelbooking', (req, res) => {
    res.send('BOOKING ROOM HAS BEEN CANCELED...')
});

app.listen(5004, () =>
    console.log('EXPRESS Server Started at Port No: 5004'));