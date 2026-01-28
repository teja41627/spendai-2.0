const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

/**
 * Proxy Rate Limiter
 * 
 * Limits requests based on the Proxy API Key provided in the Authorization header.
 * This prevents a single key from overwhelming the system or OpenAI quotas.
 */
const proxyLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 60, // Limit each proxy key to 60 requests per minute
    keyGenerator: (req) => {
        // Use the Bearer token as the unique identifier for rate limiting
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        // Fallback to IP if no key is provided
        return req.ip;
    },
    validate: { xForwardedForHeader: false }, // Prevent IP spoofing warnings if not behind proxy
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for key: ${req.headers.authorization?.substring(0, 15)}...`, 'RATELIMIT');
        res.status(429).json({
            error: {
                message: 'Too many requests. Proxy rate limit is 60 requests per minute.',
                type: 'requests_exceeded_error',
                code: 'rate_limit_exceeded'
            }
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { proxyLimiter };
