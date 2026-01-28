const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const budgetService = require('../services/budgetService');
const alertService = require('../services/alertService');

const router = express.Router();

/**
 * GET /api/budgets/summary
 * Returns current org budget and project budgets with spend
 */
router.get('/summary', authenticate, async (req, res) => {
    try {
        const orgData = await budgetService.getOrgBudget(req.user.organization_id);

        // For project budgets, we would ideally fetch projects and their budgets
        // For MVP, we'll return the org one first
        res.json({
            success: true,
            data: {
                organization: orgData
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch budget summary' });
    }
});

/**
 * PUT /api/budgets/org
 * Update organization budget (Admin only)
 */
router.put('/org', authenticate, requireAdmin, async (req, res) => {
    try {
        const { budget } = req.body;
        if (budget === undefined || budget < 0) {
            return res.status(400).json({ success: false, error: 'Invalid budget amount' });
        }

        const data = await budgetService.updateOrgBudget(req.user.organization_id, budget);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update organization budget' });
    }
});

/**
 * PUT /api/budgets/projects/:projectId
 * Update project budget (Admin only)
 */
router.put('/projects/:projectId', authenticate, requireAdmin, async (req, res) => {
    try {
        const { budget } = req.body;
        const { projectId } = req.params;

        if (budget === undefined || budget < 0) {
            return res.status(400).json({ success: false, error: 'Invalid budget amount' });
        }

        const data = await budgetService.updateProjectBudget(projectId, budget);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update project budget' });
    }
});

/**
 * GET /api/budgets/alerts
 * Get triggered alerts for organization
 */
router.get('/alerts', authenticate, async (req, res) => {
    try {
        const alerts = await alertService.getAlerts(req.user.organization_id);
        res.json({ success: true, data: alerts });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch alerts' });
    }
});

module.exports = router;
