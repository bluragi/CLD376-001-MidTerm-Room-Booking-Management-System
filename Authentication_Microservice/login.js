require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const dbconnect = require('./dbconnect.js');
const PersonModel = require('./person_schema.js');

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'login' }));

// localhost:5000/auth/login
// {
//   "email": "singmey@gmail.com",
//   "password": "abc",
//   "role": "user"
// }

// {
//   "email": "admin@gmail.com",
//   "password": "admin123",
//   "role": "admin"
// }

app.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // STEP 1: Find user by email
    const user = await PersonModel.findOne({ emailid: email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    // STEP 2: Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    // STEP 3: Check role matches
    if (user.role !== role) return res.status(403).json({ message: 'Invalid role' });

    // STEP 4: Sign JWT (id added)
    const token = jwt.sign(
      { id: user._id, email: user.emailid, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error logging in' });
  }
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Login Service is running on PORT NO: ${PORT}`));