/**
 * Pricing Service
 * 
 * Maintains static pricing for OpenAI models
 * Calculates USD cost based on token usage
 * 
 * Pricing as of January 2026 (update as needed)
 * Source: OpenAI pricing page
 */
class PricingService {

    /**
     * Get pricing table for all supported models
     * 
     * Prices are in USD per 1M tokens
     * 
     * @returns {Object} Pricing table
     */
    getPricingTable() {
        return {
            // GPT-3.5 Turbo models
            'gpt-3.5-turbo': {
                prompt: 0.50,      // $0.50 per 1M input tokens
                completion: 1.50   // $1.50 per 1M output tokens
            },
            'gpt-3.5-turbo-0125': {
                prompt: 0.50,
                completion: 1.50
            },
            'gpt-3.5-turbo-1106': {
                prompt: 1.00,
                completion: 2.00
            },

            // GPT-4 models
            'gpt-4': {
                prompt: 30.00,     // $30 per 1M input tokens
                completion: 60.00  // $60 per 1M output tokens
            },
            'gpt-4-0613': {
                prompt: 30.00,
                completion: 60.00
            },

            // GPT-4 Turbo models
            'gpt-4-turbo': {
                prompt: 10.00,     // $10 per 1M input tokens
                completion: 30.00  // $30 per 1M output tokens
            },
            'gpt-4-turbo-preview': {
                prompt: 10.00,
                completion: 30.00
            },

            // GPT-4o models (optimized)
            'gpt-4o': {
                prompt: 5.00,      // $5 per 1M input tokens
                completion: 15.00  // $15 per 1M output tokens
            },
            'gpt-4o-mini': {
                prompt: 0.15,      // $0.15 per 1M input tokens
                completion: 0.60   // $0.60 per 1M output tokens
            }
        };
    }

    /**
     * Get pricing for a specific model
     * 
     * @param {string} model - Model name
     * @returns {Object|null} Pricing object {prompt, completion} or null
     */
    getModelPricing(model) {
        const pricingTable = this.getPricingTable();
        return pricingTable[model] || null;
    }

    /**
     * Calculate cost in USD for a request
     * 
     * Formula:
     *   prompt_cost = (prompt_tokens / 1,000,000) * price_per_1M_prompt_tokens
     *   completion_cost = (completion_tokens / 1,000,000) * price_per_1M_completion_tokens
     *   total_cost = prompt_cost + completion_cost
     * 
     * @param {string} model - Model name
     * @param {number} promptTokens - Number of prompt tokens
     * @param {number} completionTokens - Number of completion tokens
     * @returns {number} Cost in USD (6 decimal places)
     */
    calculateCost(model, promptTokens, completionTokens) {
        const pricing = this.getModelPricing(model);

        if (!pricing) {
            console.warn(`No pricing found for model: ${model}. Returning $0.00`);
            return 0.00;
        }

        // Calculate cost per token type
        const promptCost = (promptTokens / 1_000_000) * pricing.prompt;
        const completionCost = (completionTokens / 1_000_000) * pricing.completion;

        // Total cost
        const totalCost = promptCost + completionCost;

        // Round to 6 decimal places for precision
        return Math.round(totalCost * 1_000_000) / 1_000_000;
    }

    /**
     * Get breakdown of cost calculation (for debugging/auditing)
     * 
     * @param {string} model - Model name
     * @param {number} promptTokens - Number of prompt tokens
     * @param {number} completionTokens - Number of completion tokens
     * @returns {Object} Cost breakdown
     */
    getCostBreakdown(model, promptTokens, completionTokens) {
        const pricing = this.getModelPricing(model);

        if (!pricing) {
            return {
                model,
                error: 'No pricing found',
                total_cost_usd: 0.00
            };
        }

        const promptCost = (promptTokens / 1_000_000) * pricing.prompt;
        const completionCost = (completionTokens / 1_000_000) * pricing.completion;
        const totalCost = promptCost + completionCost;

        return {
            model,
            pricing: {
                prompt_per_1m: pricing.prompt,
                completion_per_1m: pricing.completion
            },
            usage: {
                prompt_tokens: promptTokens,
                completion_tokens: completionTokens,
                total_tokens: promptTokens + completionTokens
            },
            costs: {
                prompt_cost_usd: Math.round(promptCost * 1_000_000) / 1_000_000,
                completion_cost_usd: Math.round(completionCost * 1_000_000) / 1_000_000,
                total_cost_usd: Math.round(totalCost * 1_000_000) / 1_000_000
            }
        };
    }

    /**
     * Validate that pricing exists for a model
     * 
     * @param {string} model - Model name
     * @returns {boolean} True if pricing exists
     */
    hasPricing(model) {
        return this.getModelPricing(model) !== null;
    }

    /**
     * Get all models with pricing
     * 
     * @returns {Array<string>} List of model names
     */
    getSupportedModels() {
        return Object.keys(this.getPricingTable());
    }
}

module.exports = new PricingService();
