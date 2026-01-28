const { supabaseAdmin } = require('../config/supabase');
const alertService = require('./alertService');

/**
 * Budget Service
 * 
 * Manages spend limits and threshold tracking for organizations and projects.
 * Integrates with usage logs to calculate real-time Month-to-Date (MTD) utilization.
 */
class BudgetService {

    /**
     * Get organization budget and MTD spend
     */
    async getOrgBudget(organizationId) {
        // 1. Get budget setting
        const { data: org, error: orgError } = await supabaseAdmin
            .from('organizations')
            .select('monthly_budget_usd')
            .eq('id', organizationId)
            .single();

        if (orgError) throw orgError;

        // 2. Calculate MTD spend
        const mtdSpend = await this.calculateMTDSpend(organizationId);

        return {
            budget: org.monthly_budget_usd,
            actual_spend: mtdSpend
        };
    }

    /**
     * Update organization budget
     */
    async updateOrgBudget(organizationId, budgetAmount) {
        const { data, error } = await supabaseAdmin
            .from('organizations')
            .update({ monthly_budget_usd: budgetAmount })
            .eq('id', organizationId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get project budget and MTD spend
     */
    async getProjectBudget(projectId) {
        const { data: project, error: pError } = await supabaseAdmin
            .from('projects')
            .select('monthly_budget_usd, organization_id')
            .eq('id', projectId)
            .single();

        if (pError) throw pError;

        const mtdSpend = await this.calculateMTDSpend(project.organization_id, projectId);

        return {
            budget: project.monthly_budget_usd,
            actual_spend: mtdSpend
        };
    }

    /**
     * Update project budget
     */
    async updateProjectBudget(projectId, budgetAmount) {
        const { data, error } = await supabaseAdmin
            .from('projects')
            .update({ monthly_budget_usd: budgetAmount })
            .eq('id', projectId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Calculate MTD Spend from usage_logs
     * 
     * @param {string} organizationId 
     * @param {string} projectId (Optional)
     */
    async calculateMTDSpend(organizationId, projectId = null) {
        const now = new Date();
        const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

        let query = supabaseAdmin
            .from('usage_logs')
            .select('cost_usd')
            .eq('organization_id', organizationId)
            .gte('created_at', startOfMonth);

        if (projectId) {
            query = query.eq('project_id', projectId);
        }

        const { data, error } = await query;
        if (error) throw error;

        const total = data.reduce((acc, row) => acc + parseFloat(row.cost_usd || 0), 0);
        return Math.round(total * 1000000) / 1000000;
    }

    /**
     * Check for budget threshold crossings and trigger alerts
     * This is called after each usage log entry.
     * 
     * @param {string} organizationId 
     * @param {string} projectId 
     */
    async checkBudgets(organizationId, projectId) {
        try {
            // 1. Check Organization Budget
            const orgData = await this.getOrgBudget(organizationId);
            if (orgData.budget > 0) {
                await this.evaluateThresholds({
                    organization_id: organizationId,
                    project_id: null,
                    alert_level: 'organization',
                    budget: orgData.budget,
                    actual: orgData.actual_spend
                });
            }

            // 2. Check Project Budget
            const projectData = await this.getProjectBudget(projectId);
            if (projectData.budget > 0) {
                await this.evaluateThresholds({
                    organization_id: organizationId,
                    project_id: projectId,
                    alert_level: 'project',
                    budget: projectData.budget,
                    actual: projectData.actual_spend
                });
            }
        } catch (error) {
            console.error('Budget check processing failed:', error.message);
        }
    }

    /**
     * Evaluate actual vs budget against thresholds
     */
    async evaluateThresholds(params) {
        const { budget, actual } = params;
        const thresholds = [100, 90, 75, 50]; // Check high to low
        const percentUsed = (actual / budget) * 100;

        for (const t of thresholds) {
            if (percentUsed >= t) {
                // Trigger alert for the highest crossed threshold
                await alertService.recordAlert({
                    organization_id: params.organization_id,
                    project_id: params.project_id,
                    alert_level: params.alert_level,
                    threshold_percent: t,
                    budget_amount: budget,
                    actual_spend: actual
                });
                // Once we find the highest threshold crossed, we stop 
                // (the DB unique constraint also prevents lower ones being re-sent if already triggered)
                break;
            }
        }
    }
}

module.exports = new BudgetService();
