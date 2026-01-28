const express = require('express');
const openaiProxyService = require('../services/openaiProxyService');
const { proxyLimiter } = require('../middleware/rateLimit');

const router = express.Router();

/**
 * POST /v1/chat/completions
 * 
 * OpenAI-compatible chat completion endpoint
 * Drop-in replacement for OpenAI API
 * 
 * Headers:
 *   Authorization: Bearer <spendai_proxy_key>
 * 
 * Body:
 *   Same as OpenAI chat completions API
 *   {
 *     "model": "gpt-4",
 *     "messages": [{"role": "user", "content": "Hello"}]
 *   }
 * 
 * Response:
 *   Same as OpenAI API (transparent pass-through)
 *   
 * Security improvements:
 *   - Model validation (allowlist)
 *   - Header whitelisting
 *   - Request ID tracing
 *   - Encrypted OpenAI keys
 *   - Proxy-key based rate limiting
 */
router.post('/chat/completions', proxyLimiter, async (req, res) => {
    try {
        // 1. Extract proxy key from Authorization header
        const authHeader = req.headers.authorization;
        const proxyKey = openaiProxyService.extractBearerToken(authHeader);

        if (!proxyKey) {
            return res.status(401).json({
                error: {
                    message: 'Missing or invalid Authorization header. Use: Authorization: Bearer <proxy_key>',
                    type: 'invalid_request_error',
                    code: 'invalid_api_key'
                }
            });
        }

        // 2. Validate request body
        const validation = openaiProxyService.validateChatCompletionRequest(req.body);

        if (!validation.valid) {
            return res.status(400).json({
                error: {
                    message: validation.error,
                    type: 'invalid_request_error',
                    code: 'invalid_request'
                }
            });
        }

        // 3. Proxy request to OpenAI
        const result = await openaiProxyService.proxyChatCompletion(
            proxyKey,
            req.body,
            req.headers
        );

        // 4. Return response with SpendAI request ID header
        if (result.success) {
            // Success: return OpenAI response transparently
            // Add SpendAI request ID for tracing
            res.setHeader('x-spendai-request-id', result.metadata.spendai_request_id);
            return res.status(result.statusCode).json(result.response);
        } else {
            // OpenAI returned an error: pass it through with request ID
            res.setHeader('x-spendai-request-id', result.metadata.spendai_request_id);
            return res.status(result.statusCode).json(result.response);
        }

    } catch (error) {
        console.error('Proxy route error:', error.message);

        // Handle specific errors
        if (error.code === 'INVALID_MODEL' || error.message.includes('Unsupported model')) {
            // Model validation error (400 Bad Request)
            return res.status(400).json({
                error: {
                    message: error.message,
                    type: 'invalid_request_error',
                    code: 'invalid_model'
                }
            });
        } else if (error.message.includes('proxy key')) {
            // Invalid/revoked proxy key
            return res.status(401).json({
                error: {
                    message: 'Invalid or revoked proxy key',
                    type: 'invalid_request_error',
                    code: 'invalid_api_key'
                }
            });
        } else if (error.message.includes('OpenAI API key not configured')) {
            // Organization hasn't set up OpenAI key
            return res.status(500).json({
                error: {
                    message: 'Organization OpenAI API key not configured',
                    type: 'server_error',
                    code: 'configuration_error'
                }
            });
        } else if (error.message.includes('decrypt')) {
            // Decryption error (corrupted key)
            return res.status(500).json({
                error: {
                    message: 'Failed to decrypt organization OpenAI key',
                    type: 'server_error',
                    code: 'decryption_error'
                }
            });
        } else if (error.message.includes('timeout')) {
            // Request timeout
            return res.status(504).json({
                error: {
                    message: 'OpenAI request timeout',
                    type: 'server_error',
                    code: 'timeout'
                }
            });
        } else {
            // Generic error
            return res.status(500).json({
                error: {
                    message: 'Internal proxy error',
                    type: 'server_error',
                    code: 'internal_error'
                }
            });
        }
    }
});

/**
 * Health check for proxy endpoint
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'SpendAI OpenAI Proxy',
        version: '1.0.0',
        security: {
            key_encryption: 'AES-256-GCM',
            key_validation: 'HMAC-SHA256',
            model_validation: 'Allowlist',
            header_filtering: 'Whitelist'
        },
        endpoints: {
            chat_completions: '/v1/chat/completions'
        }
    });
});

module.exports = router;
