const express = require('express');
const authService = require('../services/authService');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/signup
 * Create a new user and organization
 */
router.post('/signup', async (req, res) => {
    try {
        const { email, password, organizationName } = req.body;

        // Validation
        if (!email || !password || !organizationName) {
            return res.status(400).json({
                success: false,
                error: 'Email, password, and organization name are required'
            });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }

        // Password validation (minimum 6 characters)
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters long'
            });
        }

        // Organization name validation
        if (organizationName.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Organization name must be at least 2 characters long'
            });
        }

        // Call signup service
        const result = await authService.signup(email, password, organizationName);

        return res.status(201).json(result);

    } catch (error) {
        console.error('Signup route error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Signup failed'
        });
    }
});

/**
 * POST /api/auth/login
 * Log in an existing user
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        // Call login service
        const result = await authService.login(email, password);

        return res.status(200).json(result);

    } catch (error) {
        console.error('Login route error:', error);

        // Return appropriate error status
        const statusCode = error.message.includes('Invalid login credentials') ? 401 : 500;

        return res.status(statusCode).json({
            success: false,
            error: error.message || 'Login failed'
        });
    }
});

/**
 * GET /api/auth/me
 * Get current user profile (requires authentication)
 */
router.get('/me', authenticate, async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            user: req.user
        });
    } catch (error) {
        console.error('Get user route error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get user profile'
        });
    }
});

module.exports = router;
