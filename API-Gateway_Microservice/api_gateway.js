require('dotenv').config();
const express = require('express');
const httpProxy = require('http-proxy');
const jwt = require('jsonwebtoken');

const app = express();
const proxy = httpProxy.createProxyServer();

const JWT_SECRET = process.env.JWT_SECRET;

const REG_URL     = process.env.REG_URL     || 'http://localhost:5001';
const LOGIN_URL   = process.env.LOGIN_URL   || 'http://localhost:5002';
const ROOM_URL    = process.env.ROOM_URL    || 'http://localhost:5003';
const BOOKING_URL = process.env.BOOKING_URL || 'http://localhost:5004';
const PAYMENT_URL = process.env.PAYMENT_URL || 'http://localhost:5005';
const NOTIF_URL   = process.env.NOTIF_URL   || 'http://localhost:5006';

function authToken(req, res, next) {
    const header = req.headers.authorization;
    const token = header && header.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Please send token' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user; // { id, email, role }
        next();
    });
}

function authRole(rules) {
    return (req, res, next) => {
        const allowed = rules[req.method];
        if (!allowed || !allowed.includes(req.user.role)) {
            return res.status(403).json({ message: 'Unauthorized: role not allowed' });
        }
        next();
    };
}

// GET /my... is for users, any other GET is for admin
function myOrAdmin(rules) {
    return (req, res, next) => {
        if (req.method === 'GET') {
            const allowed = req.path.startsWith('/my') ? ['user'] : ['admin'];
            if (!allowed.includes(req.user.role)) {
                return res.status(403).json({ message: 'Unauthorized: role not allowed' });
            }
            return next();
        }
        return authRole(rules)(req, res, next);
    };
}

function forward(target) {
    return (req, res) => {
        proxy.web(req, res, {
            target,
            headers: req.user
                ? { 'x-user-id': req.user.id, 'x-user-email': req.user.email, 'x-user-role': req.user.role }
                : {},
        });
    };
}

proxy.on('error', (err, req, res) => {
    console.error('Proxy error:', err.message);
    if (!res.headersSent) res.status(502).json({ message: 'Service unavailable' });
});

// ---------- Public ----------
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'api-gateway' }));

// LOGIN service
app.use('/auth', forward(LOGIN_URL));

// REGISTRATION service (public: POST /reg/userregister)
app.use('/reg', (req, res, next) => {
    if (req.method === 'POST' && req.path === '/userregister') return forward(REG_URL)(req, res);
    next();
}, authToken, authRole({ GET: ['admin'], PUT: ['admin'], DELETE: ['admin'] }), forward(REG_URL));

// ---------- Protected ----------
// ROOM
app.use('/room', authToken,
    authRole({ GET: ['admin', 'user'], POST: ['admin'], PUT: ['admin'], DELETE: ['admin'] }),
    forward(ROOM_URL));

// BOOKING
app.use('/booking', authToken,
    myOrAdmin({ POST: ['user'], PUT: ['user', 'admin'], DELETE: ['admin'] }),
    forward(BOOKING_URL));

// PAYMENT (POST removed: payments are created only by the Booking service)
app.use('/payment', authToken,
    myOrAdmin({ PUT: ['admin'], DELETE: ['admin'] }),
    forward(PAYMENT_URL));

// NOTIFICATION
app.use('/notification', authToken,
    myOrAdmin({ PUT: ['user'], DELETE: ['admin'] }),
    forward(NOTIF_URL));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API Gateway Service is running on PORT NO : ${PORT}`));
