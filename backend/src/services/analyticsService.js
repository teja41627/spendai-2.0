const { supabaseAdmin } = require('../config/supabase');

/**
 * Analytics Service
 * 
 * Handles read-only aggregation queries on usage_logs table
 * Strict organization isolation is enforced
 */
class AnalyticsService {

    /**
     * Get total spend summary for an organization
     * Includes: MTD (Month to Date), Last 7 Days, Last 30 Days
     * 
     * @param {string} organizationId - Organization UUID
     * @returns {Object} Spend summary
     */
    async getSpendSummary(organizationId) {
        const now = new Date();
        // Use UTC for start dates to ensure consistency across regions
        const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

        // Query for all three time ranges
        // For large datasets, these would be separate optimized queries or cached views

        // MTD
        const { data: mtdData, error: mtdError } = await supabaseAdmin
            .from('usage_logs')
            .select('cost_usd')
            .eq('organization_id', organizationId)
            .gte('created_at', startOfMonth);

        // Last 7 Days
        const { data: last7Data, error: last7Error } = await supabaseAdmin
            .from('usage_logs')
            .select('cost_usd')
            .eq('organization_id', organizationId)
            .gte('created_at', last7Days);

        // Last 30 Days
        const { data: last30Data, error: last30Error } = await supabaseAdmin
            .from('usage_logs')
            .select('cost_usd')
            .eq('organization_id', organizationId)
            .gte('created_at', last30Days);

        if (mtdError || last7Error || last30Error) {
            throw new Error('Failed to fetch spend summary');
        }

        const calculateSum = (data) => {
            if (!data || data.length === 0) return 0;
            const sum = data.reduce((acc, row) => acc + parseFloat(row.cost_usd || 0), 0);
            return Math.round(sum * 1000000) / 1000000;
        };

        return {
            month_to_date: calculateSum(mtdData),
            last_7_days: calculateSum(last7Data),
            last_30_days: calculateSum(last30Data)
        };
    }

    /**
     * Get spend breakdown by project
     * 
     * @param {string} organizationId - Organization UUID
     * @returns {Array} List of projects with spend
     */
    async getSpendByProject(organizationId) {
        // Note: Supabase's simple JS client doesn't support complex GROUP BY well
        // We'll fetch and aggregate, or use a RPC if performance becomes an issue
        // For now, we fetch project names and join in-memory or via select

        const { data, error } = await supabaseAdmin
            .from('usage_logs')
            .select(`
        cost_usd,
        project_id,
        projects (name)
      `)
            .eq('organization_id', organizationId);

        if (error) throw error;

        const aggregation = data.reduce((acc, row) => {
            const pid = row.project_id;
            const pName = row.projects ? row.projects.name : 'Unknown Project';

            if (!acc[pid]) {
                acc[pid] = { project_id: pid, project_name: pName, total_spend: 0, request_count: 0 };
            }

            acc[pid].total_spend += parseFloat(row.cost_usd);
            acc[pid].request_count += 1;
            return acc;
        }, {});

        return Object.values(aggregation).map(item => ({
            ...item,
            total_spend: Math.round(item.total_spend * 1000000) / 1000000
        })).sort((a, b) => b.total_spend - a.total_spend);
    }

    /**
     * Get spend breakdown by model
     * 
     * @param {string} organizationId - Organization UUID
     * @returns {Array} List of models with spend
     */
    async getSpendByModel(organizationId) {
        const { data, error } = await supabaseAdmin
            .from('usage_logs')
            .select('model, cost_usd')
            .eq('organization_id', organizationId);

        if (error) throw error;

        const aggregation = data.reduce((acc, row) => {
            const model = row.model;
            if (!acc[model]) {
                acc[model] = { model, total_spend: 0, request_count: 0 };
            }
            acc[model].total_spend += parseFloat(row.cost_usd);
            acc[model].request_count += 1;
            return acc;
        }, {});

        return Object.values(aggregation).map(item => ({
            ...item,
            total_spend: Math.round(item.total_spend * 1000000) / 1000000
        })).sort((a, b) => b.total_spend - a.total_spend);
    }

    /**
     * Get daily spend over time (last 30 days)
     * 
     * @param {string} organizationId - Organization UUID
     * @returns {Array} Daily spend data
     */
    async getDailySpend(organizationId) {
        const now = new Date();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const { data, error } = await supabaseAdmin
            .from('usage_logs')
            .select('cost_usd, created_at')
            .eq('organization_id', organizationId)
            .gte('created_at', last30Days.toISOString());

        if (error) throw error;

        const aggregation = data.reduce((acc, row) => {
            // Use UTC date as the key
            const date = new Date(row.created_at).toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = { date, total_spend: 0 };
            }
            acc[date].total_spend += parseFloat(row.cost_usd || 0);
            return acc;
        }, {});

        const result = [];
        for (let i = 29; i >= 0; i--) {
            // Calculate date in UTC
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = d.toISOString().split('T')[0];

            result.push({
                date: dateStr,
                total_spend: aggregation[dateStr]
                    ? Math.round(aggregation[dateStr].total_spend * 1000000) / 1000000
                    : 0
            });
        }

        return result;
    }
}

module.exports = new AnalyticsService();
