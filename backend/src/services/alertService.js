const { supabaseAdmin } = require('../config/supabase');

/**
 * Alert Service
 * 
 * Handles storing and retrieving triggered spend alerts.
 * Uses unique constraints to ensure alerts only trigger once per month per threshold.
 */
class AlertService {

    /**
     * Record a triggered alert
     * 
     * @param {Object} params - Alert parameters
     */
    async recordAlert(params) {
        const {
            organization_id,
            project_id,
            alert_level,
            threshold_percent,
            budget_amount,
            actual_spend
        } = params;

        const month_year = new Date().toISOString().substring(0, 7); // 'YYYY-MM'

        try {
            const { data, error } = await supabaseAdmin
                .from('alerts')
                .insert({
                    organization_id,
                    project_id,
                    alert_level,
                    threshold_percent,
                    budget_amount,
                    actual_spend,
                    month_year
                })
                .select()
                .single();

            if (error) {
                // Handle unique constraint violations silently (alert already sent)
                if (error.code === '23505') {
                    return { success: true, already_sent: true };
                }
                console.error('Failed to record alert:', error.message);
                throw error;
            }

            console.log(`[ALERT] ${alert_level.toUpperCase()} budget crossed ${threshold_percent}% threshold: ${actual_spend}/${budget_amount}`);
            return { success: true, data };
        } catch (error) {
            console.error('Alert recording error:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get recently triggered alerts for an organization
     * 
     * @param {string} organizationId 
     * @returns {Promise<Array>}
     */
    async getAlerts(organizationId) {
        const { data, error } = await supabaseAdmin
            .from('alerts')
            .select(`
        *,
        projects (name)
      `)
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }
}

module.exports = new AlertService();
