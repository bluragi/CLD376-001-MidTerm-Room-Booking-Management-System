const e1 = require('express');
const app = e1();
app.use(e1.json());

//Send notification
app.post('/sendnotification', (req, res) => {
    const status = req.body?.status || 'Unknown';

    let message;
    if (status === 'Success') {
        message = 'Your booking has been completed successfully!';
    } else if (status === 'Failure') {
        message = 'Your booking could not be completed due to payment failure.';
    } else {
        message = 'Booking status unknown.';
    }

    console.log(`Notification: Booking ${status} - ${message}`);
    res.send(`Notification sent: Booking ${status}`);
});

//Run express server
app.listen(5006, () =>
    console.log('EXPRESS Server Started at Port No: 5006'));

