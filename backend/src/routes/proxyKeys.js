const express = require('express');
const proxyKeyService = require('../services/proxyKeyService');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/proxy-keys/project/:projectId
 * Get all proxy keys for a specific project
 * Accessible to all authenticated users in the organization
 */
router.get('/project/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { organizationId } = req.user;

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(projectId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid project ID format'
            });
        }

        const result = await proxyKeyService.getProxyKeys(projectId, organizationId);

        return res.status(200).json(result);

    } catch (error) {
        console.error('Get proxy keys route error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch proxy keys'
        });
    }
});

/**
 * GET /api/proxy-keys/project/:projectId/count
 * Get key count for a project
 */
router.get('/project/:projectId/count', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { organizationId } = req.user;

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(projectId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid project ID format'
            });
        }

        const result = await proxyKeyService.getKeyCount(projectId, organizationId);

        return res.status(200).json(result);

    } catch (error) {
        console.error('Get key count route error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to get key count'
        });
    }
});

/**
 * GET /api/proxy-keys/:id
 * Get a specific proxy key by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { organizationId } = req.user;

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid key ID format'
            });
        }

        const result = await proxyKeyService.getProxyKey(id, organizationId);

        return res.status(200).json(result);

    } catch (error) {
        console.error('Get proxy key route error:', error);

        const statusCode = error.message === 'Proxy key not found' ? 404 : 500;

        return res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to fetch proxy key'
        });
    }
});

/**
 * POST /api/proxy-keys
 * Create a new proxy key (Admin only)
 * 
 * Body:
 * {
 *   "projectId": "uuid",
 *   "name": "optional-key-name"
 * }
 */
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { projectId, name } = req.body;
        const { organizationId, id: userId } = req.user;

        // Validation
        if (!projectId) {
            return res.status(400).json({
                success: false,
                error: 'Project ID is required'
            });
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(projectId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid project ID format'
            });
        }

        // Validate name if provided
        if (name && name.length > 255) {
            return res.status(400).json({
                success: false,
                error: 'Key name must be less than 255 characters'
            });
        }

        const result = await proxyKeyService.createProxyKey(
            organizationId,
            projectId,
            userId,
            name ? name.trim() : ''
        );

        return res.status(201).json(result);

    } catch (error) {
        console.error('Create proxy key route error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to create proxy key'
        });
    }
});

/**
 * POST /api/proxy-keys/:id/revoke
 * Revoke (disable) a proxy key (Admin only)
 */
router.post('/:id/revoke', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { organizationId } = req.user;

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid key ID format'
            });
        }

        const result = await proxyKeyService.revokeProxyKey(id, organizationId);

        return res.status(200).json(result);

    } catch (error) {
        console.error('Revoke proxy key route error:', error);

        const statusCode = error.message === 'Proxy key not found' ? 404 : 500;

        return res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to revoke proxy key'
        });
    }
});

module.exports = router;
