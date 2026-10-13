// Room_Microservice/room_schema.js
const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema(
  {
    roomNumber:    { type: String, required: true, unique: true, trim: true },
    type:          { type: String, required: true, enum: ['single', 'double', 'suite', 'deluxe'] },
    pricePerNight: { type: Number, required: true, min: 0 },
    capacity:      { type: Number, required: true, min: 1 },
    description:   { type: String, default: '' },
    status:        { type: String, enum: ['available', 'maintenance'], default: 'available' }
  },
  { timestamps: true }
);

// third argument = exact collection name in MongoDB
module.exports = mongoose.model('Room', RoomSchema, 'rooms');
