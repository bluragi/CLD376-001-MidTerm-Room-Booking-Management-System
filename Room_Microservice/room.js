// Room_Microservice/room.js
const express = require('express');
const app = express();
app.use(express.json());

const dbconnect = require('./dbconnect.js');
const RoomModel = require('./room_schema.js');

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'room' }));

/*
Through the gateway (port 5000):
  POST   /room/addroom            admin
  GET    /room/viewrooms          admin, user   (?type=&maxPrice=&capacity=&status=)
  GET    /room/viewroom/:id       admin, user
  PUT    /room/updateroom/:id     admin
  DELETE /room/deleteroom/:id     admin

Example body for addroom:
{
  "roomNumber": "101",
  "type": "double",
  "pricePerNight": 80,
  "capacity": 2,
  "description": "City view"
}
*/

// ADD ROOM
app.post('/addroom', async (req, res) => {
  try {
    const { roomNumber, type, pricePerNight, capacity, description } = req.body;

    if (!roomNumber || !type || pricePerNight == null || !capacity) {
      return res.status(400).json({ message: 'roomNumber, type, pricePerNight and capacity are required' });
    }

    const existing = await RoomModel.findOne({ roomNumber });
    if (existing) {
      return res.status(409).json({ message: 'Room number already exists' });
    }

    const room = await RoomModel.create({ roomNumber, type, pricePerNight, capacity, description });
    res.status(201).json({ message: 'Room added successfully', room });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error adding room' });
  }
});

// VIEW ALL ROOMS (with optional filters)
app.get('/viewrooms', async (req, res) => {
  try {
    const { type, status, maxPrice, capacity } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (maxPrice) filter.pricePerNight = { $lte: Number(maxPrice) };
    if (capacity) filter.capacity = { $gte: Number(capacity) };

    // normal users only ever see rooms that can be booked
    if (req.headers['x-user-role'] === 'user') filter.status = 'available';

    const rooms = await RoomModel.find(filter).sort({ roomNumber: 1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error fetching rooms' });
  }
});

// VIEW ONE ROOM (Booking service also calls this)
app.get('/viewroom/:id', async (req, res) => {
  try {
    if (!require('mongoose').isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid room id' });
    }
    const room = await RoomModel.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error fetching room' });
  }
});

// UPDATE ROOM
app.put('/updateroom/:id', async (req, res) => {
  try {
    if (!require('mongoose').isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid room id' });
    }

    const allowed = ['roomNumber', 'type', 'pricePerNight', 'capacity', 'description', 'status'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const room = await RoomModel.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json({ message: 'Room updated successfully', room });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error updating room' });
  }
});

// DELETE ROOM
app.delete('/deleteroom/:id', async (req, res) => {
  try {
    if (!require('mongoose').isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid room id' });
    }
    const room = await RoomModel.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error deleting room' });
  }
});

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`Room Service is running on PORT NO: ${PORT}`));
