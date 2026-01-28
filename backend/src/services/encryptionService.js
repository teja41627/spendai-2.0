const crypto = require('crypto');

/**
 * Encryption Service for OpenAI API Keys
 * 
 * Uses AES-256-GCM for authenticated encryption
 * - Confidentiality: Keys encrypted at rest
 * - Integrity: Tampering detected via auth tag
 * - Forward secrecy: Each encryption uses unique IV
 */
class EncryptionService {

    /**
     * Get the master encryption key from environment
     * @returns {Buffer} 32-byte encryption key
     */
    getMasterKey() {
        const secret = process.env.OPENAI_KEY_ENCRYPTION_SECRET;
        if (!secret) {
            throw new Error('OPENAI_KEY_ENCRYPTION_SECRET environment variable is not set');
        }

        // Convert hex string to buffer (256-bit key)
        if (secret.length !== 64) {
            throw new Error('OPENAI_KEY_ENCRYPTION_SECRET must be 32 bytes (64 hex chars)');
        }

        return Buffer.from(secret, 'hex');
    }

    /**
     * Encrypt an OpenAI API key using AES-256-GCM
     * 
     * @param {string} plaintext - Raw OpenAI API key (e.g., sk-proj-...)
     * @returns {string} Encrypted key in format: iv:authTag:ciphertext (all hex)
     */
    encrypt(plaintext) {
        if (!plaintext || typeof plaintext !== 'string') {
            throw new Error('Plaintext must be a non-empty string');
        }

        try {
            // Generate random IV (12 bytes is standard for GCM)
            const iv = crypto.randomBytes(12);

            // Get master key
            const key = this.getMasterKey();

            // Create cipher
            const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

            // Encrypt
            let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
            ciphertext += cipher.final('hex');

            // Get authentication tag (ensures integrity)
            const authTag = cipher.getAuthTag();

            // Return format: iv:authTag:ciphertext (all hex-encoded)
            return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext}`;

        } catch (error) {
            console.error('Encryption error:', error.message);
            throw new Error('Failed to encrypt OpenAI API key');
        }
    }

    /**
     * Decrypt an OpenAI API key using AES-256-GCM
     * 
     * @param {string} encrypted - Encrypted key in format: iv:authTag:ciphertext
     * @returns {string} Decrypted OpenAI API key
     */
    decrypt(encrypted) {
        if (!encrypted || typeof encrypted !== 'string') {
            throw new Error('Encrypted text must be a non-empty string');
        }

        try {
            // Parse format: iv:authTag:ciphertext
            const parts = encrypted.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted format');
            }

            const iv = Buffer.from(parts[0], 'hex');
            const authTag = Buffer.from(parts[1], 'hex');
            const ciphertext = parts[2];

            // Get master key
            const key = this.getMasterKey();

            // Create decipher
            const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

            // Set auth tag (will verify integrity)
            decipher.setAuthTag(authTag);

            // Decrypt
            let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
            plaintext += decipher.final('utf8');

            return plaintext;

        } catch (error) {
            console.error('Decryption error:', error.message);
            throw new Error('Failed to decrypt OpenAI API key (corrupted or tampered)');
        }
    }

    /**
     * Check if a value is encrypted (has our format)
     * @param {string} value - Value to check
     * @returns {boolean} True if encrypted
     */
    isEncrypted(value) {
        if (!value || typeof value !== 'string') {
            return false;
        }

        // Check format: hex:hex:hex
        const parts = value.split(':');
        if (parts.length !== 3) {
            return false;
        }

        // Check if all parts are valid hex
        const hexRegex = /^[0-9a-f]+$/i;
        return parts.every(part => hexRegex.test(part));
    }
}

module.exports = new EncryptionService();
