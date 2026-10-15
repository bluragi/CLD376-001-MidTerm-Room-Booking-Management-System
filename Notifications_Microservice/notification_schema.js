const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    userId:    { type: String },
    bookingId: { type: String },
    status:    { type: String },
    message:   { type: String, required: true },
    read:      { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema, 'notifications');
