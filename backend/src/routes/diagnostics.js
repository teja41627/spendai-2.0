const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const router = express.Router();

/**
 * GET /api/diagnostics/ping
 * Simple health check
 */
router.get('/ping', (req, res) => {
    res.json({ success: true, message: 'pong', timestamp: new Date().toISOString() });
});

/**
 * GET /api/diagnostics/check-supabase
 * Tests the connection and service role permissions
 */
router.get('/check-supabase', async (req, res) => {
    const results = {
        supabase_url: !!process.env.SUPABASE_URL,
        supabase_service_key: !!process.env.SUPABASE_SERVICE_KEY,
        connection: false,
        rls_bypass_check: false,
        error: null
    };

    try {
        // Test 1: Simple connection via organizations count
        const { count, error } = await supabaseAdmin
            .from('organizations')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;
        results.connection = true;

        // Test 2: Try to select from users (checks if service key has access)
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('count')
            .limit(1);

        if (!userError) {
            results.rls_bypass_check = true;
        } else {
            results.error = `User select failed: ${userError.message}`;
        }

        res.json({ success: true, data: results });
    } catch (err) {
        results.error = err.message;
        res.status(500).json({ success: false, data: results });
    }
});

module.exports = router;
