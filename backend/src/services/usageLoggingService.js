const { supabaseAdmin } = require('../config/supabase');
const pricingService = require('./pricingService');
const budgetService = require('./budgetService');

/**
 * Usage Logging Service
 * 
 * Logs successful OpenAI API usage for cost tracking and analytics
 * Creates finance-grade ledger entries with immutable records
 */
class UsageLoggingService {

    /**
     * Log a successful OpenAI API request
     * 
     * Requirements:
     * - Only log successful responses
     * - Extract tokens from OpenAI response
     * - Calculate cost using pricing service
     * - Store pricing snapshot (for audit trail)
     * - Store explicit currency
     * - Write synchronously (no background jobs)
     * - One row per request (no aggregation)
     * 
     * @param {Object} params - Logging parameters
     * @param {string} params.request_id - SpendAI request ID (UUID)
     * @param {string} params.organization_id - Organization UUID
     * @param {string} params.project_id - Project UUID
     * @param {string} params.proxy_key_id - Proxy key UUID
     * @param {string} params.model - Model name (e.g., gpt-4)
     * @param {number} params.prompt_tokens - Number of prompt tokens
     * @param {number} params.completion_tokens - Number of completion tokens
     * @param {number} params.total_tokens - Total tokens (for validation)
     * @returns {Object} Created usage log entry
     */
    async logUsage(params) {
        const {
            request_id,
            organization_id,
            project_id,
            proxy_key_id,
            model,
            prompt_tokens,
            completion_tokens,
            total_tokens
        } = params;

        // Validate required fields
        if (!request_id || !organization_id || !project_id || !proxy_key_id || !model) {
            throw new Error('Missing required fields for usage logging');
        }

        if (typeof prompt_tokens !== 'number' || typeof completion_tokens !== 'number') {
            throw new Error('Token counts must be numbers');
        }

        if (prompt_tokens < 0 || completion_tokens < 0) {
            throw new Error('Token counts cannot be negative');
        }

        try {
            // 1. Calculate cost
            const cost_usd = pricingService.calculateCost(model, prompt_tokens, completion_tokens);

            // 2. Get pricing snapshot for audit trail
            const pricing = pricingService.getModelPricing(model);
            const price_prompt_per_million = pricing ? pricing.prompt : null;
            const price_completion_per_million = pricing ? pricing.completion : null;

            // Log cost breakdown for auditing (only in development)
            if (process.env.NODE_ENV === 'development') {
                const breakdown = pricingService.getCostBreakdown(model, prompt_tokens, completion_tokens);
                console.log(`[${request_id}] Cost breakdown:`, JSON.stringify(breakdown, null, 2));
            }

            // 3. Insert usage log with pricing snapshot and currency
            const { data, error } = await supabaseAdmin
                .from('usage_logs')
                .insert({
                    request_id,
                    organization_id,
                    project_id,
                    proxy_key_id,
                    model,
                    provider: 'openai',
                    tokens_prompt: prompt_tokens,
                    tokens_completion: completion_tokens,
                    // tokens_total is a generated column in DB
                    cost_usd,
                    // Refinement: Store exact prices used
                    price_prompt_per_million,
                    price_completion_per_million,
                    // Refinement: Explicit currency
                    currency: 'USD',
                    status: 'success'
                })
                .select()
                .single();

            if (error) {
                // Log error but don't fail the request
                console.error(`[${request_id}] Failed to log usage:`, error.message);
                throw new Error(`Failed to log usage: ${error.message}`);
            }

            console.log(`[${request_id}] Usage logged: ${model}, ${total_tokens} tokens, $${cost_usd.toFixed(6)}`);

            // 4. Check budgets and trigger alerts (fire and forget)
            budgetService.checkBudgets(organization_id, project_id).catch(err => {
                console.error(`[${request_id}] Budget check failed:`, err.message);
            });

            return {
                success: true,
                log: data
            };

        } catch (error) {
            // Log but re-throw (caller decides how to handle)
            console.error(`[${request_id}] Usage logging error:`, error.message);
            throw error;
        }
    }

    /**
     * Extract usage data from OpenAI response
     * 
     * OpenAI response format:
     * {
     *   "id": "chatcmpl-...",
     *   "model": "gpt-4",
     *   "usage": {
     *     "prompt_tokens": 10,
     *     "completion_tokens": 20,
     *     "total_tokens": 30
     *   },
     *   ...
     * }
     * 
     * @param {Object} openaiResponse - OpenAI API response
     * @returns {Object|null} Extracted usage data or null if missing
     */
    extractUsageFromResponse(openaiResponse) {
        if (!openaiResponse) {
            return null;
        }

        // Extract model
        const model = openaiResponse.model;
        if (!model) {
            return null;
        }

        // Refinement: Guard against missing usage object
        const usage = openaiResponse.usage;
        if (!usage) {
            return null;
        }

        // Extract token counts
        const prompt_tokens = usage.prompt_tokens;
        const completion_tokens = usage.completion_tokens;
        const total_tokens = usage.total_tokens;

        // Validate
        if (typeof prompt_tokens !== 'number' || typeof completion_tokens !== 'number') {
            return null;
        }

        return {
            model,
            prompt_tokens,
            completion_tokens,
            total_tokens
        };
    }

    /**
     * Log usage from an OpenAI response (convenience method)
     * 
     * Combines extraction and logging in one call
     * 
     * @param {Object} params - Logging parameters
     * @param {string} params.request_id - SpendAI request ID
     * @param {string} params.organization_id - Organization UUID
     * @param {string} params.project_id - Project UUID
     * @param {string} params.proxy_key_id - Proxy key UUID
     * @param {Object} params.openaiResponse - Full OpenAI response
     * @returns {Object|null} Created usage log entry or null if skipped
     */
    async logFromOpenAIResponse(params) {
        const {
            request_id,
            organization_id,
            project_id,
            proxy_key_id,
            openaiResponse
        } = params;

        // Extract usage data from response
        const usage = this.extractUsageFromResponse(openaiResponse);

        // Refinement: skip logging if usage is missing
        if (!usage) {
            console.warn(`[${request_id}] Skipping usage logging: 'usage' object missing in OpenAI response.`);
            return null;
        }

        // Log usage
        return await this.logUsage({
            request_id,
            organization_id,
            project_id,
            proxy_key_id,
            model: usage.model,
            prompt_tokens: usage.prompt_tokens,
            completion_tokens: usage.completion_tokens,
            total_tokens: usage.total_tokens
        });
    }
}

module.exports = new UsageLoggingService();
