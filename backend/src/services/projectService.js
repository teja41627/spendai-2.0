const { supabaseAdmin } = require('../config/supabase');

/**
 * ProjectService handles all project-related operations
 */
class ProjectService {

    /**
     * Create a new project
     * @param {string} organizationId - Organization ID
     * @param {string} userId - User ID creating the project
     * @param {string} name - Project name
     * @param {string} description - Project description (optional)
     * @returns {Object} Created project
     */
    async createProject(organizationId, userId, name, description = '') {
        try {
            const { data, error } = await supabaseAdmin
                .from('projects')
                .insert({
                    organization_id: organizationId,
                    name: name,
                    description: description,
                    created_by: userId
                })
                .select()
                .single();

            if (error) {
                throw new Error(`Failed to create project: ${error.message}`);
            }

            return {
                success: true,
                project: data
            };

        } catch (error) {
            console.error('Create project error:', error);
            throw error;
        }
    }

    /**
     * Get all projects for an organization
     * @param {string} organizationId - Organization ID
     * @returns {Object} List of projects
     */
    async getProjects(organizationId) {
        try {
            const { data, error } = await supabaseAdmin
                .from('projects')
                .select(`
          id,
          name,
          description,
          created_at,
          updated_at,
          created_by,
          monthly_budget_usd,
          creator:created_by (
            id,
            email,
            role
          )
        `)
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false });

            if (error) {
                throw new Error(`Failed to fetch projects: ${error.message}`);
            }

            return {
                success: true,
                projects: data || []
            };

        } catch (error) {
            console.error('Get projects error:', error);
            throw error;
        }
    }

    /**
     * Get a single project by ID
     * @param {string} projectId - Project ID
     * @param {string} organizationId - Organization ID (for verification)
     * @returns {Object} Project details
     */
    async getProject(projectId, organizationId) {
        try {
            // 1. Get Project Data
            const { data, error } = await supabaseAdmin
                .from('projects')
                .select(`
          id,
          name,
          description,
          created_at,
          updated_at,
          created_by,
          organization_id,
          monthly_budget_usd,
          creator:created_by (
            id,
            email,
            role
          )
        `)
                .eq('id', projectId)
                .eq('organization_id', organizationId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    throw new Error('Project not found');
                }
                throw new Error(`Failed to fetch project: ${error.message}`);
            }

            // 2. Get MTD Spend
            const budgetService = require('./budgetService');
            const mtdSpend = await budgetService.calculateMTDSpend(organizationId, projectId);

            return {
                success: true,
                project: {
                    ...data,
                    mtd_spend: mtdSpend
                }
            };

        } catch (error) {
            console.error('Get project error:', error);
            throw error;
        }
    }

    /**
     * Update a project
     * @param {string} projectId - Project ID
     * @param {string} organizationId - Organization ID (for verification)
     * @param {Object} updates - Fields to update (name, description)
     * @returns {Object} Updated project
     */
    async updateProject(projectId, organizationId, updates) {
        try {
            const allowedFields = ['name', 'description'];
            const updateData = {};

            // Filter only allowed fields
            for (const field of allowedFields) {
                if (updates[field] !== undefined) {
                    updateData[field] = updates[field];
                }
            }

            const { data, error } = await supabaseAdmin
                .from('projects')
                .update(updateData)
                .eq('id', projectId)
                .eq('organization_id', organizationId)
                .select()
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    throw new Error('Project not found');
                }
                throw new Error(`Failed to update project: ${error.message}`);
            }

            return {
                success: true,
                project: data
            };

        } catch (error) {
            console.error('Update project error:', error);
            throw error;
        }
    }

    /**
     * Delete a project
     * @param {string} projectId - Project ID
     * @param {string} organizationId - Organization ID (for verification)
     * @returns {Object} Success confirmation
     */
    async deleteProject(projectId, organizationId) {
        try {
            const { error } = await supabaseAdmin
                .from('projects')
                .delete()
                .eq('id', projectId)
                .eq('organization_id', organizationId);

            if (error) {
                throw new Error(`Failed to delete project: ${error.message}`);
            }

            return {
                success: true,
                message: 'Project deleted successfully'
            };

        } catch (error) {
            console.error('Delete project error:', error);
            throw error;
        }
    }

    /**
     * Get project count for an organization
     * @param {string} organizationId - Organization ID
     * @returns {Object} Count of projects
     */
    async getProjectCount(organizationId) {
        try {
            const { count, error } = await supabaseAdmin
                .from('projects')
                .select('id', { count: 'exact', head: true })
                .eq('organization_id', organizationId);

            if (error) {
                throw new Error(`Failed to count projects: ${error.message}`);
            }

            return {
                success: true,
                count: count || 0
            };

        } catch (error) {
            console.error('Get project count error:', error);
            throw error;
        }
    }
}

module.exports = new ProjectService();
