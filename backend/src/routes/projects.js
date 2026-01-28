const express = require('express');
const projectService = require('../services/projectService');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/projects
 * Get all projects for the authenticated user's organization
 */
router.get('/', async (req, res) => {
    try {
        const { organizationId } = req.user;

        const result = await projectService.getProjects(organizationId);

        return res.status(200).json(result);

    } catch (error) {
        console.error('Get projects route error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch projects'
        });
    }
});

/**
 * GET /api/projects/count
 * Get project count for the organization
 */
router.get('/count', async (req, res) => {
    try {
        const { organizationId } = req.user;

        const result = await projectService.getProjectCount(organizationId);

        return res.status(200).json(result);

    } catch (error) {
        console.error('Get project count route error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to get project count'
        });
    }
});

/**
 * GET /api/projects/:id
 * Get a specific project by ID
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
                error: 'Invalid project ID format'
            });
        }

        const result = await projectService.getProject(id, organizationId);

        return res.status(200).json(result);

    } catch (error) {
        console.error('Get project route error:', error);

        const statusCode = error.message === 'Project not found' ? 404 : 500;

        return res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to fetch project'
        });
    }
});

/**
 * POST /api/projects
 * Create a new project (Admin only)
 */
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { name, description } = req.body;
        const { organizationId, id: userId } = req.user;

        // Validation
        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Project name is required'
            });
        }

        if (name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Project name must be at least 2 characters long'
            });
        }

        if (name.length > 255) {
            return res.status(400).json({
                success: false,
                error: 'Project name must be less than 255 characters'
            });
        }

        const result = await projectService.createProject(
            organizationId,
            userId,
            name.trim(),
            description ? description.trim() : ''
        );

        return res.status(201).json(result);

    } catch (error) {
        console.error('Create project route error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to create project'
        });
    }
});

/**
 * PUT /api/projects/:id
 * Update a project (Admin only)
 */
router.put('/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const { organizationId } = req.user;

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid project ID format'
            });
        }

        // Validation
        if (name !== undefined) {
            if (name.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    error: 'Project name must be at least 2 characters long'
                });
            }
            if (name.length > 255) {
                return res.status(400).json({
                    success: false,
                    error: 'Project name must be less than 255 characters'
                });
            }
        }

        const updates = {};
        if (name !== undefined) updates.name = name.trim();
        if (description !== undefined) updates.description = description.trim();

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No fields to update'
            });
        }

        const result = await projectService.updateProject(id, organizationId, updates);

        return res.status(200).json(result);

    } catch (error) {
        console.error('Update project route error:', error);

        const statusCode = error.message === 'Project not found' ? 404 : 500;

        return res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to update project'
        });
    }
});

/**
 * DELETE /api/projects/:id
 * Delete a project (Admin only)
 */
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { organizationId } = req.user;

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid project ID format'
            });
        }

        const result = await projectService.deleteProject(id, organizationId);

        return res.status(200).json(result);

    } catch (error) {
        console.error('Delete project route error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to delete project'
        });
    }
});

module.exports = router;
