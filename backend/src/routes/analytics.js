const express = require('express');
const { authenticate } = require('../middleware/auth');
const analyticsService = require('../services/analyticsService');

const router = express.Router();

/**
 * GET /api/analytics/summary
 * Returns spend summary (MTD, 7d, 30d)
 */
router.get('/summary', authenticate, async (req, res) => {
    try {
        const summary = await analyticsService.getSpendSummary(req.user.organization_id);
        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Analytics Summary Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch spend summary'
        });
    }
});

/**
 * GET /api/analytics/projects
 * Returns spend breakdown by project
 */
router.get('/projects', authenticate, async (req, res) => {
    try {
        const projects = await analyticsService.getSpendByProject(req.user.organization_id);
        res.json({
            success: true,
            data: projects
        });
    } catch (error) {
        console.error('Analytics Projects Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch project spend breakdown'
        });
    }
});

/**
 * GET /api/analytics/models
 * Returns spend breakdown by model
 */
router.get('/models', authenticate, async (req, res) => {
    try {
        const models = await analyticsService.getSpendByModel(req.user.organization_id);
        res.json({
            success: true,
            data: models
        });
    } catch (error) {
        console.error('Analytics Models Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch model spend breakdown'
        });
    }
});

/**
 * GET /api/analytics/daily
 * Returns daily spend over time (30d)
 */
router.get('/daily', authenticate, async (req, res) => {
    try {
        const daily = await analyticsService.getDailySpend(req.user.organization_id);
        res.json({
            success: true,
            data: daily
        });
    } catch (error) {
        console.error('Analytics Daily Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch daily spend data'
        });
    }
});

module.exports = router;
