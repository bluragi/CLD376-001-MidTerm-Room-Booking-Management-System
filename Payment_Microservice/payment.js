//Import Server
const e1 = require('express')

// Create object of that server
const app = e1();
app.use(e1.json())

//Payment process
app.post('/paymentprocess', (req, res) => {
    const isSuccess = Math.random() > 0.5;
    const status = isSuccess ? 'Success' : 'Failure';
    
    console.log(`Payment processed: ${status}`);
    
    if (isSuccess) {
        res.json({ status: 'Success', message: 'Payment processed successfully!' });
    } else {
        res.json({ status: 'Failure', message: 'Payment failed!' });
    }
});

//Start the express server. 5005 is the port num
app.listen(5005, () =>
    console.log('EXPRESS Server Started at Port No: 5005'));
