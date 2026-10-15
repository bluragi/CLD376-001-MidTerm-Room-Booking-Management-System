const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const dbconnect = require('./dbconnect.js');
const RoomBookingModel = require('./booking_schema.js');

const ROOM_URL = process.env.ROOM_URL || 'http://localhost:5003';
const PAYMENT_URL = process.env.PAYMENT_URL || 'http://localhost:5005';
const NOTIF_URL = process.env.NOTIF_URL || 'http://localhost:5006';

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'booking' }));

// BOOK A ROOM (user)   body: { roomId, checkIn, checkOut }
app.post('/bookroom', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const userEmail = req.headers['x-user-email'];
        if (!userId) return res.status(401).json({ message: 'Missing user identity (call through the API gateway)' });

        const { roomId, checkIn, checkOut } = req.body;
        if (!roomId || !checkIn || !checkOut) {
            return res.status(400).json({ message: 'roomId, checkIn and checkOut are required' });
        }
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        if (isNaN(start) || isNaN(end) || end <= start) {
            return res.status(400).json({ message: 'Invalid dates: checkOut must be after checkIn' });
        }

        // 1. Ask the Room service about the room
        let room;
        try {
            const roomResponse = await axios.get(`${ROOM_URL}/viewroom/${roomId}`);
            room = roomResponse.data;
        } catch (err) {
            if (err.response && err.response.status === 404) {
                return res.status(404).json({ message: 'Room not found' });
            }
            throw err;
        }
        if (room.status !== 'available') {
            return res.status(409).json({ message: 'Room is not available for booking' });
        }

        // 2. Check date overlap in room_booking_service
        const clash = await RoomBookingModel.findOne({
            roomId,
            bookingStatus: { $in: ['PENDING', 'CONFIRMED'] },
            checkIn: { $lt: end },
            checkOut: { $gt: start }
        });
        if (clash) {
            return res.status(409).json({ message: 'Room is already booked for these dates' });
        }

        // 3. Save booking as PENDING
        const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const booking = await RoomBookingModel.create({
            userId, userEmail, roomId,
            roomNumber: room.roomNumber,
            checkIn: start, checkOut: end,
            nights,
            totalPrice: nights * room.pricePerNight
        });

        // 4. Call the Payment service
        const paymentResponse = await axios.post(`${PAYMENT_URL}/paymentprocess`, {
            bookingId: booking._id,
            userId,
            amount: booking.totalPrice
        });
        const { status } = paymentResponse.data;

        // 5. Update the booking with the payment result
        booking.paymentStatus = status;
        booking.bookingStatus = status === 'Success' ? 'CONFIRMED' : 'FAILED';
        await booking.save();

        // 6. Notification (a failure here should not undo the booking)
        const message = status === 'Success'
            ? 'Your booking has been completed successfully!'
            : 'Your booking could not be completed due to payment failure.';
        await axios.post(`${NOTIF_URL}/sendnotification`, {
            userId,
            bookingId: booking._id,
            status,
            message
        }).catch(e => console.error('Notification failed:', e.message));

        res.status(status === 'Success' ? 201 : 402).json({
            message: `Booking processed. Payment ${status}.`,
            booking
        });
    } catch (error) {
        res.status(500).json({ error: 'Booking processing failed', details: error.message });
    }
});

// MY BOOKINGS (user)
app.get('/mybookings', async (req, res) => {
    try {
        const bookings = await RoomBookingModel.find({ userId: req.headers['x-user-id'] }).sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ALL BOOKINGS (admin)
app.get('/allbookings', async (req, res) => {
    try {
        const bookings = await RoomBookingModel.find().sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CANCEL BOOKING (user cancels own, admin cancels any)
app.put('/cancelbooking/:id', async (req, res) => {
    try {
        const booking = await RoomBookingModel.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        const isAdmin = req.headers['x-user-role'] === 'admin';
        if (!isAdmin && booking.userId !== req.headers['x-user-id']) {
            return res.status(403).json({ message: 'You can only cancel your own booking' });
        }
        if (booking.bookingStatus === 'CANCELLED') {
            return res.status(400).json({ message: 'Booking is already cancelled' });
        }

        booking.bookingStatus = 'CANCELLED';
        await booking.save();
        res.json({ message: 'Booking cancelled', booking });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE BOOKING RECORD (admin)
app.delete('/deletebooking/:id', async (req, res) => {
    try {
        const booking = await RoomBookingModel.findByIdAndDelete(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json({ message: 'Booking record deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => console.log(`Booking Service is running on PORT NO: ${PORT}`));
