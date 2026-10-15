const express = require('express');
const app = express();
app.use(express.json());

const dbconnect = require('./dbconnect.js');
const NotificationModel = require('./notification_schema.js');

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'notification' }));

// INTERNAL ONLY: called by the Booking service
app.post('/sendnotification', async (req, res) => {
    try {
        const { userId, bookingId, status, message } = req.body;

        const text = message ||
            (status === 'Success' ? 'Your booking has been completed successfully!'
            : status === 'Failure' ? 'Your booking could not be completed due to payment failure.'
            : 'Booking status unknown.');

        const notification = await NotificationModel.create({ userId, bookingId, status, message: text });
        console.log(`Notification: ${text}`);
        res.status(201).json({ message: 'Notification sent', notification });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// MY NOTIFICATIONS (user)
app.get('/mynotifications', async (req, res) => {
    try {
        const list = await NotificationModel.find({ userId: req.headers['x-user-id'] }).sort({ createdAt: -1 });
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ALL NOTIFICATIONS (admin)
app.get('/allnotifications', async (req, res) => {
    try {
        res.json(await NotificationModel.find().sort({ createdAt: -1 }));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// MARK AS READ (user, own notification only)
app.put('/markread/:id', async (req, res) => {
    try {
        const n = await NotificationModel.findById(req.params.id);
        if (!n) return res.status(404).json({ message: 'Notification not found' });
        if (n.userId !== req.headers['x-user-id']) {
            return res.status(403).json({ message: 'Not your notification' });
        }
        n.read = true;
        await n.save();
        res.json({ message: 'Marked as read', notification: n });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE NOTIFICATION (admin)
app.delete('/deletenotification/:id', async (req, res) => {
    try {
        const n = await NotificationModel.findByIdAndDelete(req.params.id);
        if (!n) return res.status(404).json({ message: 'Notification not found' });
        res.json({ message: 'Notification deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const PORT = process.env.PORT || 5006;
app.listen(PORT, () => console.log(`Notification Service is running on PORT NO: ${PORT}`));
