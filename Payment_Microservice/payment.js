const express = require('express');
const app = express();
app.use(express.json());

const dbconnect = require('./dbconnect.js');
const PaymentModel = require('./payment_schema.js');

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'payment' }));

// INTERNAL ONLY: called by the Booking service
app.post('/paymentprocess', async (req, res) => {
    try {
        const { bookingId, userId, amount } = req.body;
        if (!bookingId || amount == null) {
            return res.status(400).json({ message: 'bookingId and amount are required' });
        }

        const status = Math.random() > 0.5 ? 'Success' : 'Failure';
        await PaymentModel.create({ bookingId, userId, amount, status });

        res.json({
            status,
            message: status === 'Success' ? 'Payment processed successfully!' : 'Payment failed!'
        });
    } catch (err) {
        res.status(500).json({ message: err.message || 'Error processing payment' });
    }
});

// MY PAYMENTS (user)
app.get('/mypayments', async (req, res) => {
    try {
        const payments = await PaymentModel.find({ userId: req.headers['x-user-id'] }).sort({ createdAt: -1 });
        res.json(payments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ALL PAYMENTS (admin)
app.get('/allpayments', async (req, res) => {
    try {
        const payments = await PaymentModel.find().sort({ createdAt: -1 });
        res.json(payments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// REFUND (admin)
app.put('/refund/:id', async (req, res) => {
    try {
        const payment = await PaymentModel.findById(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        if (payment.status !== 'Success') {
            return res.status(400).json({ message: 'Only successful payments can be refunded' });
        }
        payment.status = 'Refunded';
        await payment.save();
        res.json({ message: 'Payment refunded', payment });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => console.log(`Payment Service is running on PORT NO: ${PORT}`));
