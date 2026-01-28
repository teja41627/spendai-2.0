const axios = require('axios');
const crypto = require('crypto');
const proxyKeyService = require('./proxyKeyService');
const encryptionService = require('./encryptionService');
const usageLoggingService = require('./usageLoggingService');
const { supabaseAdmin } = require('../config/supabase');

/**
 * OpenAI Proxy Service
 * 
 * Handles proxying requests to OpenAI API with transparent pass-through.
 * Validates proxy keys and uses organization's OpenAI API key.
 * 
 * Security features:
 * - Encrypts OpenAI keys at rest (AES-256-GCM)
 * - Validates models against allowlist
 * - Whitelists headers before forwarding
 * - Generates request IDs for tracing
 */
class OpenAIProxyService {

    /**
     * Supported OpenAI models (allowlist)
     * Prevents invalid models from breaking cost tracking in Phase 6
     */
    getSupportedModels() {
        return [
            'gpt-3.5-turbo',
            'gpt-3.5-turbo-0125',
            'gpt-3.5-turbo-1106',
            'gpt-4',
            'gpt-4-0613',
            'gpt-4-turbo',
            'gpt-4-turbo-preview',
            'gpt-4o',
            'gpt-4o-mini'
        ];
    }

    /**
     * Validate model name against allowlist
     * @param {string} model - Model name from request
     * @returns {Object} Validation result
     */
    validateModel(model) {
        if (!model || typeof model !== 'string') {
            return { valid: false, error: 'model is required' };
        }

        const supportedModels = this.getSupportedModels();
        if (!supportedModels.includes(model)) {
            return {
                valid: false,
                error: `Unsupported model: ${model}. Supported models: ${supportedModels.join(', ')}`
            };
        }

        return { valid: true };
    }

    /**
     * Generate unique request ID for tracing
     * @returns {string} UUID v4
     */
    generateRequestId() {
        return crypto.randomUUID();
    }

    /**
     * Get OpenAI API base URL
     */
    getOpenAIBaseURL() {
        return 'https://api.openai.com';
    }

    /**
     * Extract Bearer token from Authorization header
     * @param {string} authHeader - Authorization header value
     * @returns {string|null} Token or null
     */
    extractBearerToken(authHeader) {
        if (!authHeader || typeof authHeader !== 'string') {
            return null;
        }

        if (authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        return null;
    }

    /**
     * Get organization's OpenAI API key (decrypted)
     * 
     * Security: Keys are stored encrypted (AES-256-GCM)
     * Decrypted only in memory before use
     * 
     * @param {string} organizationId - Organization ID
     * @returns {string} Decrypted OpenAI API key
     */
    async getOrganizationOpenAIKey(organizationId) {
        const { data, error } = await supabaseAdmin
            .from('organizations')
            .select('openai_api_key')
            .eq('id', organizationId)
            .single();

        if (error) {
            throw new Error('Failed to fetch organization OpenAI key');
        }

        if (!data || !data.openai_api_key) {
            throw new Error('Organization OpenAI API key not configured');
        }

        // Decrypt the key (stored encrypted in DB)
        try {
            const encryptedKey = data.openai_api_key;

            // Check if key is encrypted (has our format: iv:authTag:ciphertext)
            if (encryptionService.isEncrypted(encryptedKey)) {
                // Decrypt using AES-256-GCM
                return encryptionService.decrypt(encryptedKey);
            } else {
                // Legacy: Key not yet encrypted (for migration)
                // In production, you should encrypt all existing keys
                console.warn(`Organization ${organizationId} has unencrypted OpenAI key`);
                return encryptedKey;
            }
        } catch (decryptError) {
            console.error('Failed to decrypt OpenAI key:', decryptError.message);
            throw new Error('Failed to decrypt organization OpenAI API key');
        }
    }

    /**
     * Build whitelisted headers for OpenAI request
     * 
     * Security: Only forward safe headers
     * Explicitly set Authorization with org's key
     * Drop all other headers to prevent injection
     * 
     * @param {Object} requestHeaders - Original request headers
     * @param {string} openaiApiKey - Organization's OpenAI API key
     * @returns {Object} Whitelisted headers
     */
    buildForwardHeaders(requestHeaders, openaiApiKey) {
        const forwardHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`
        };

        // Whitelist safe headers
        const allowedHeaders = ['accept', 'user-agent'];

        for (const header of allowedHeaders) {
            if (requestHeaders[header]) {
                // Capitalize header name properly
                const headerName = header.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
                forwardHeaders[headerName] = requestHeaders[header];
            }
        }

        return forwardHeaders;
    }

    /**
     * Proxy a chat completion request to OpenAI
     * 
     * Flow:
     * 1. Generate request ID
     * 2. Validate proxy key
     * 3. Validate model
     * 4. Get organization's OpenAI key (decrypt)
     * 5. Build whitelisted headers
     * 6. Forward request to OpenAI
     * 7. Return response with request ID
     * 
     * @param {string} proxyKey - SpendAI proxy key
     * @param {Object} requestBody - OpenAI chat completion request
     * @param {Object} requestHeaders - Original request headers
     * @returns {Object} OpenAI response with metadata
     */
    async proxyChatCompletion(proxyKey, requestBody, requestHeaders = {}) {
        // 1. Generate unique request ID for tracing
        const requestId = this.generateRequestId();

        try {
            // 2. Validate proxy key
            const keyValidation = await proxyKeyService.verifyProxyKey(proxyKey);

            if (!keyValidation.success || !keyValidation.key) {
                throw new Error('Invalid or revoked proxy key');
            }

            const { organization_id, project_id, id: keyId } = keyValidation.key;

            // 3. Validate model (allowlist check)
            const modelValidation = this.validateModel(requestBody.model);
            if (!modelValidation.valid) {
                const error = new Error(modelValidation.error);
                error.code = 'INVALID_MODEL';
                throw error;
            }

            // 4. Get organization's OpenAI API key (decrypted)
            const openaiApiKey = await this.getOrganizationOpenAIKey(organization_id);

            // 5. Prepare request to OpenAI
            const openaiURL = `${this.getOpenAIBaseURL()}/v1/chat/completions`;

            // 6. Build whitelisted headers (security: drop dangerous headers)
            const forwardHeaders = this.buildForwardHeaders(requestHeaders, openaiApiKey);

            // 7. Forward request to OpenAI
            const openaiResponse = await axios.post(openaiURL, requestBody, {
                headers: forwardHeaders,
                timeout: 60000, // 60 second timeout
                validateStatus: (status) => status < 600, // Don't throw on 4xx/5xx
            });

            // 8. Log usage for successful responses only (synchronous)
            if (openaiResponse.status === 200) {
                try {
                    await usageLoggingService.logFromOpenAIResponse({
                        request_id: requestId,
                        organization_id,
                        project_id,
                        proxy_key_id: keyId,
                        openaiResponse: openaiResponse.data
                    });
                } catch (loggingError) {
                    // Log error but don't fail the request
                    // Usage logging failure should not block the client
                    console.error(`[${requestId}] Usage logging failed:`, loggingError.message);
                    // Continue and return response to client
                }
            }

            // 9. Return OpenAI response with request ID
            return {
                success: true,
                response: openaiResponse.data,
                statusCode: openaiResponse.status,
                headers: openaiResponse.headers,
                metadata: {
                    spendai_request_id: requestId,
                    organization_id,
                    project_id,
                    proxy_key_id: keyId,
                    timestamp: new Date().toISOString(),
                    openai_request_id: openaiResponse.headers['x-request-id'] || null
                }
            };

        } catch (error) {
            // Log error with request ID for tracing
            console.error(`[${requestId}] Proxy error:`, error.message);

            // Handle specific error types
            if (error.code === 'INVALID_MODEL') {
                // Model validation error
                throw error;
            } else if (error.response) {
                // OpenAI returned an error response
                return {
                    success: false,
                    error: 'OpenAI API error',
                    response: error.response.data,
                    statusCode: error.response.status,
                    headers: error.response.headers,
                    metadata: {
                        spendai_request_id: requestId
                    }
                };
            } else if (error.code === 'ECONNABORTED') {
                // Request timeout
                throw new Error('OpenAI request timeout');
            } else if (error.message.includes('proxy key')) {
                // Proxy key validation error
                throw error;
            } else if (error.message.includes('decrypt')) {
                // Decryption error
                throw new Error('Failed to decrypt organization OpenAI key');
            } else {
                // Other errors
                throw new Error('Proxy request failed');
            }
        }
    }

    /**
     * Validate chat completion request body
     * @param {Object} body - Request body
     * @returns {Object} Validation result
     */
    validateChatCompletionRequest(body) {
        if (!body) {
            return { valid: false, error: 'Request body is required' };
        }

        if (!body.model) {
            return { valid: false, error: 'model is required' };
        }

        if (!body.messages || !Array.isArray(body.messages)) {
            return { valid: false, error: 'messages must be an array' };
        }

        if (body.messages.length === 0) {
            return { valid: false, error: 'messages cannot be empty' };
        }

        return { valid: true };
    }
}

module.exports = new OpenAIProxyService();
