/**
 * Environment Validation
 * 
 * Ensures all required secrets and configuration keys are present
 * before the server starts.
 */

const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'OPENAI_KEY_ENCRYPTION_SECRET',
    'PROXY_KEY_SECRET'
];

const optionalVars = [
    'NODE_ENV',
    'PORT'
];

function validate() {
    const missing = [];

    for (const v of requiredVars) {
        if (!process.env[v]) {
            missing.push(v);
        }
    }

    if (missing.length > 0) {
        console.error(`\x1b[31m[FATAL] Missing required environment variables: ${missing.join(', ')}\x1b[0m`);
        console.error('[FATAL] SpendAI cannot start without these secrets. Please check your .env file.');
        process.exit(1);
    }

    // Set default NODE_ENV
    if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'development';
    }

    console.log(`[INFO] Environment validation passed. Context: ${process.env.NODE_ENV}`);
}

module.exports = { validate };
