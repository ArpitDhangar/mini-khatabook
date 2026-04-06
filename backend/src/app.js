const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const ledgerRoutes = require('./routes/ledger');
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check (public)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth routes (public — login / register / me)
app.use('/api/auth', authRoutes);

// Protected API routes — require valid JWT
app.use('/api/customers', authMiddleware, customerRoutes);
app.use('/api/ledger',    authMiddleware, ledgerRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
