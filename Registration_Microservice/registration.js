const express = require('express');
var app = express();

var bodyParser = require("body-parser");
app.use(bodyParser.json());

const bcrypt = require('bcryptjs');

// ADD THIS TEMPORARILY
app.use((req, res, next) => {
    console.log("Content-Type:", req.headers['content-type']);
    console.log("Body received:", req.body);
    next();
});

const dbconnect = require('./dbconnect.js');
const PersonModel = require('./person_schema.js');

// In the postman use the following URL
// localhost:5000/reg

// {
//   "name":"Singmey",
//   "email":"singmey@gmail.com",
//   "password":"abc",
//   "phone": 12345678,
//   "role": "user"
// }

// {
//   "name": "Admin",
//   "email": "admin@gmail.com",
//   "password": "admin123",
//   "phone": 99999999,
//   "role": "admin"
// }


function uniqueid(min, max) {
    return Math.floor(
    Math.random() * (max - min + 1) + min
    )
}

//REG API
app.post('/userregister', async (req, res) => {
    try {
    // STEP 1: Check if email already exists
    const existingUser = await PersonModel.findOne({ email: req.body.email });
    if (existingUser) {
        return res.status(409).send({ message: 'Email already registered' });
    }

    // STEP 2: Hash the password before storing
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // STEP 3: Create and save the new user
    const pobj = new PersonModel({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
        phone: req.body.phone,
        role: req.body.role
        });

    const savedUser = await pobj.save();
    res.status(200).send({ message: 'User registered successfully' });

    } catch (err) {
        res.status(500).send({ message: err.message || 'Error registering user' });
    }
});

// START THE EXPRESS SERVER. 5001 is the PORT NUMBER
app.listen(5001, () => console.log('EXPRESS Server Started at Port No: 5001'));