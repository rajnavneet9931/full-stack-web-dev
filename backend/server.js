// server.js - Production Ready (Docker + Nginx)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────

// Allow all origins (you can restrict later)
app.use(cors({
origin: '*',
credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/otp', require('./routes/otpRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));

// Health check route
app.get('/api/health', (req, res) => {
res.json({
status: 'OK',
message: 'TechSphere API is running',
timestamp: new Date().toISOString()
});
});

// Root route (no frontend crash)
app.get('/', (req, res) => {
res.send('TechSphere API is running 🚀');
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
console.error('Unhandled Error:', err.stack);
res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Server Start ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
console.log(`\n🚀 TechSphere Server running on port ${PORT}`);
console.log(`📦 API: /api`);
});
