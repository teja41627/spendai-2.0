const crypto = require('crypto');
const { supabaseAdmin } = require('../config/supabase');

/**
 * ProxyKeyService handles all proxy API key operations
 */
class ProxyKeyService {

    /**
     * Get the server secret for HMAC key hashing
     * CRITICAL: This secret must never be exposed to clients
     */
    getServerSecret() {
        const secret = process.env.PROXY_KEY_SECRET;
        if (!secret) {
            throw new Error('PROXY_KEY_SECRET environment variable is not set');
        }
        return secret;
    }

    /**
     * Generate a secure, unique proxy API key
     * Format: sk-spendai-{32 random hex chars}
     */
    generateKeyValue() {
        const randomBytes = crypto.randomBytes(32);
        const keyValue = `sk-spendai-${randomBytes.toString('hex')}`;
        return keyValue;
    }

    /**
     * Hash a key value for secure storage using HMAC-SHA256
     * 
     * Why HMAC instead of plain SHA-256?
     * - Adds server-side secret (pepper) to hash
     * - Even if DB leaks, attackers cannot pre-compute hashes
     * - Hash comparison is meaningless without the secret
     * - Industry standard for API key storage (Stripe-style)
     * 
     * @param {string} keyValue - The plaintext key value
     * @returns {string} HMAC-SHA256 hash in hex format
     */
    hashKeyValue(keyValue) {
        const secret = this.getServerSecret();
        return crypto
            .createHmac('sha256', secret)
            .update(keyValue)
            .digest('hex');
    }

    /**
     * Mask a key for display
     * Shows: sk-****{last 4 chars}
     */
    maskKeyValue(keyValue) {
        if (!keyValue || keyValue.length < 4) {
            return '****';
        }
        const last4 = keyValue.slice(-4);
        return `sk-****${last4}`;
    }

    /**
     * Create a new proxy API key
     * @param {string} organizationId - Organization ID
     * @param {string} projectId - Project ID
     * @param {string} userId - User ID creating the key
     * @param {string} name - Optional name for the key
     * @returns {Object} Created key with full key value (only shown once)
     */
    async createProxyKey(organizationId, projectId, userId, name = '') {
        try {
            // Generate unique key value
            const keyValue = this.generateKeyValue();
            const keyHash = this.hashKeyValue(keyValue);
            const masked = this.maskKeyValue(keyValue);

            // Insert into database (store hash, not plaintext)
            const { data, error } = await supabaseAdmin
                .from('proxy_keys')
                .insert({
                    organization_id: organizationId,
                    project_id: projectId,
                    key_value: keyHash,  // ⚠️ Store HASH only
                    name: name || masked,
                    is_active: true,
                    created_by: userId
                })
                .select(`
          id,
          organization_id,
          project_id,
          name,
          is_active,
          created_at,
          revoked_at,
          created_by
        `)
                .single();

            if (error) {
                throw new Error(`Failed to create proxy key: ${error.message}`);
            }

            // Return key info with FULL key value (only shown once)
            return {
                success: true,
                key: {
                    ...data,
                    keyValue: keyValue,  // ⚠️ Full key - ONLY RETURNED ONCE
                    masked: masked
                },
                warning: 'Save this key now. It will not be shown again.'
            };

        } catch (error) {
            console.error('Create proxy key error:', error);
            throw error;
        }
    }

    /**
     * Get all proxy keys for a project
     * @param {string} projectId - Project ID
     * @param {string} organizationId - Organization ID (for verification)
     * @returns {Object} List of keys (masked)
     */
    async getProxyKeys(projectId, organizationId) {
        try {
            const { data, error } = await supabaseAdmin
                .from('proxy_keys')
                .select(`
          id,
          project_id,
          name,
          is_active,
          created_at,
          revoked_at,
          created_by,
          creator:created_by (
            id,
            email,
            role
          )
        `)
                .eq('project_id', projectId)
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false });

            if (error) {
                throw new Error(`Failed to fetch proxy keys: ${error.message}`);
            }

            // Add masked display to each key
            const keysWithMask = (data || []).map(key => ({
                ...key,
                masked: key.name.startsWith('sk-****') ? key.name : `sk-****${key.id.slice(-4)}`
            }));

            return {
                success: true,
                keys: keysWithMask
            };

        } catch (error) {
            console.error('Get proxy keys error:', error);
            throw error;
        }
    }

    /**
     * Get a single proxy key by ID
     * @param {string} keyId - Key ID
     * @param {string} organizationId - Organization ID (for verification)
     * @returns {Object} Key details (masked)
     */
    async getProxyKey(keyId, organizationId) {
        try {
            const { data, error } = await supabaseAdmin
                .from('proxy_keys')
                .select(`
          id,
          project_id,
          name,
          is_active,
          created_at,
          revoked_at,
          organization_id,
          created_by,
          creator:created_by (
            id,
            email,
            role
          )
        `)
                .eq('id', keyId)
                .eq('organization_id', organizationId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    throw new Error('Proxy key not found');
                }
                throw new Error(`Failed to fetch proxy key: ${error.message}`);
            }

            return {
                success: true,
                key: {
                    ...data,
                    masked: data.name.startsWith('sk-****') ? data.name : `sk-****${data.id.slice(-4)}`
                }
            };

        } catch (error) {
            console.error('Get proxy key error:', error);
            throw error;
        }
    }

    /**
     * Revoke (disable) a proxy key
     * @param {string} keyId - Key ID
     * @param {string} organizationId - Organization ID (for verification)
     * @returns {Object} Success confirmation
     */
    async revokeProxyKey(keyId, organizationId) {
        try {
            const { data, error } = await supabaseAdmin
                .from('proxy_keys')
                .update({
                    is_active: false,
                    revoked_at: new Date().toISOString()
                })
                .eq('id', keyId)
                .eq('organization_id', organizationId)
                .select()
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    throw new Error('Proxy key not found');
                }
                throw new Error(`Failed to revoke proxy key: ${error.message}`);
            }

            return {
                success: true,
                message: 'Proxy key revoked successfully',
                key: data
            };

        } catch (error) {
            console.error('Revoke proxy key error:', error);
            throw error;
        }
    }

    /**
   * Verify a proxy key value (for future proxy requests)
   * 
   * Security Features:
   * - Uses constant-time comparison to prevent timing attacks
   * - Rejects revoked keys early
   * - Returns minimal info on failure
   * 
   * @param {string} keyValue - The plaintext key value
   * @returns {Object} Key info if valid and active
   */
    async verifyProxyKey(keyValue) {
        try {
            // Hash the provided key using HMAC-SHA256
            const keyHash = this.hashKeyValue(keyValue);

            // Query ALL active keys (we'll do constant-time comparison)
            // Note: For production with many keys, consider indexing key_value for performance
            const { data: keys, error } = await supabaseAdmin
                .from('proxy_keys')
                .select(`
          id,
          organization_id,
          project_id,
          key_value,
          is_active,
          revoked_at
        `)
                .eq('is_active', true);

            if (error) {
                throw new Error('Key verification failed');
            }

            if (!keys || keys.length === 0) {
                throw new Error('Invalid or revoked proxy key');
            }

            // Find matching key using constant-time comparison
            let matchedKey = null;

            for (const key of keys) {
                // Both hashes are hex strings, convert to buffers for comparison
                const storedHashBuffer = Buffer.from(key.key_value, 'hex');
                const providedHashBuffer = Buffer.from(keyHash, 'hex');

                // Ensure both buffers are the same length for timingSafeEqual
                if (storedHashBuffer.length === providedHashBuffer.length) {
                    try {
                        // crypto.timingSafeEqual prevents timing attacks
                        // Returns true if buffers are equal, throws if not
                        if (crypto.timingSafeEqual(storedHashBuffer, providedHashBuffer)) {
                            matchedKey = key;
                            break;
                        }
                    } catch (e) {
                        // timingSafeEqual throws on mismatch, continue to next key
                        continue;
                    }
                }
            }

            if (!matchedKey) {
                throw new Error('Invalid or revoked proxy key');
            }

            // Double-check key is active (belt and suspenders)
            if (!matchedKey.is_active) {
                throw new Error('Invalid or revoked proxy key');
            }

            return {
                success: true,
                key: {
                    id: matchedKey.id,
                    organization_id: matchedKey.organization_id,
                    project_id: matchedKey.project_id,
                    is_active: matchedKey.is_active
                }
            };

        } catch (error) {
            console.error('Verify proxy key error:', error.message);
            // Don't leak info about why verification failed
            throw new Error('Invalid or revoked proxy key');
        }
    }

    /**
     * Get key count for a project
     * @param {string} projectId - Project ID
     * @param {string} organizationId - Organization ID
     * @returns {Object} Active and total key counts
     */
    async getKeyCount(projectId, organizationId) {
        try {
            // Get total count
            const { count: totalCount, error: totalError } = await supabaseAdmin
                .from('proxy_keys')
                .select('id', { count: 'exact', head: true })
                .eq('project_id', projectId)
                .eq('organization_id', organizationId);

            if (totalError) {
                throw new Error(`Failed to count keys: ${totalError.message}`);
            }

            // Get active count
            const { count: activeCount, error: activeError } = await supabaseAdmin
                .from('proxy_keys')
                .select('id', { count: 'exact', head: true })
                .eq('project_id', projectId)
                .eq('organization_id', organizationId)
                .eq('is_active', true);

            if (activeError) {
                throw new Error(`Failed to count active keys: ${activeError.message}`);
            }

            return {
                success: true,
                total: totalCount || 0,
                active: activeCount || 0,
                revoked: (totalCount || 0) - (activeCount || 0)
            };

        } catch (error) {
            console.error('Get key count error:', error);
            throw error;
        }
    }
}

module.exports = new ProxyKeyService();
