const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true },
    userId:    { type: String },
    amount:    { type: Number, required: true, min: 0 },
    status:    { type: String, enum: ['Success', 'Failure', 'Refunded'], required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', PaymentSchema, 'payments');
