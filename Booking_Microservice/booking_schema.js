const mongoose = require('mongoose');

const RoomBookingSchema = new mongoose.Schema(
  {
    userId:        { type: String, required: true },
    userEmail:     { type: String },
    roomId:        { type: String, required: true },
    roomNumber:    { type: String },
    checkIn:       { type: Date, required: true },
    checkOut:      { type: Date, required: true },
    nights:        { type: Number },
    totalPrice:    { type: Number },
    paymentStatus: { type: String, enum: ['Pending', 'Success', 'Failure'], default: 'Pending' },
    bookingStatus: { type: String, enum: ['PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED'], default: 'PENDING' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('RoomBooking', RoomBookingSchema, 'room_booking_service');
