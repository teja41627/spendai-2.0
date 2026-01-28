require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const logger = require('./config/logger');

// 1. Environment Validation
env.validate();

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// Enable trust proxy for Railway/Vercel (required for rate limiting)
if (isProd) {
    app.set('trust proxy', 1);
}

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { success: false, error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: false // Completely disable validation for production stability
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);

// 3. Request Logging (Standardized)
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, 'HTTP');
    next();
});

// 4. Production Health Checks
app.get('/', (req, res) => {
    res.json({ message: 'SpendAI Backend API is live', environment: process.env.NODE_ENV });
});

app.get('/health', (req, res) => {
    logger.info('Health check requested', 'HEALTH');
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        node_version: process.version
    });
});

app.get('/ready', (req, res) => {
    // Basic readiness - in a full production app, you might check DB connection here
    res.json({ status: 'ready' });
});

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const proxyKeyRoutes = require('./routes/proxyKeys');
const openaiProxyRoutes = require('./routes/openaiProxy');
const analyticsRoutes = require('./routes/analytics');
const budgetRoutes = require('./routes/budgets');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/proxy-keys', proxyKeyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/budgets', budgetRoutes);

// OpenAI Proxy Routes (OpenAI-compatible endpoints)
app.use('/v1', openaiProxyRoutes);

// 5. 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// 6. Production Error Handler (No internal leakage)
app.use((err, req, res, next) => {
    logger.error(err.message, 'UNCAUGHT_ERR');

    const statusCode = err.status || 500;
    const response = {
        success: false,
        error: isProd ? 'Internal server error' : err.message
    };

    if (!isProd && err.stack) {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`SpendAI Server started on port ${PORT}`, 'STARTUP');
    logger.info(`Environment: ${process.env.NODE_ENV}`, 'STARTUP');
    logger.info(`Server listening on 0.0.0.0:${PORT}`, 'STARTUP');
});

// Handle server errors
server.on('error', (err) => {
    logger.error(`Server failed to start: ${err.message}`, 'STARTUP');
    process.exit(1);
});

module.exports = app;
