const axios = require('axios');

const API_BASE = 'http://localhost:3001';
const PROXY_BASE = 'http://localhost:3001/v1';

async function runSmokeTests() {
    console.log('🚀 Starting SpendAI Smoke Tests...\n');

    let total = 0;
    let passed = 0;
    let failed = 0;

    const run = async (name, fn) => {
        total++;
        try {
            await fn();
            console.log(`PASS: ${name}`);
            passed++;
        } catch (err) {
            console.log(`FAIL: ${name} - ${err.message}`);
            if (err.response) {
                console.log(`      Status: ${err.response.status}`);
            }
            failed++;
        }
    };

    await run('Backend Health Check', async () => {
        const res = await axios.get(`${API_BASE}/health`);
        if (res.data.status !== 'ok') throw new Error(`Status was ${res.data.status}`);
    });

    await run('Backend Readiness Check', async () => {
        const res = await axios.get(`${API_BASE}/ready`);
        if (res.data.status !== 'ready') throw new Error(`Status was ${res.data.status}`);
    });

    await run('Proxy Health Check', async () => {
        const res = await axios.get(`${PROXY_BASE}/health`);
        if (res.data.status !== 'ok') throw new Error(`Status was ${res.data.status}`);
    });

    await run('Rate Limit Headers', async () => {
        const res = await axios.get(`${PROXY_BASE}/health`);
        // express-rate-limit headers
        if (!res.headers['ratelimit-limit'] && !res.headers['x-ratelimit-limit']) {
            throw new Error('Rate limit headers missing');
        }
    });

    await run('CORS Headers', async () => {
        const res = await axios.get(`${API_BASE}/health`);
        if (!res.headers['access-control-allow-origin']) throw new Error('CORS headers missing');
    });

    await run('Rate Limit Trigger', async () => {
        console.log('      Firing rapid requests (61 bursts)...');
        const tasks = [];
        for (let i = 0; i < 65; i++) {
            // We use a fake key to avoid hitting real quotas if any, 
            // but the rate limiter handles keys independently.
            tasks.push(axios.post(`${PROXY_BASE}/chat/completions`, {}, {
                headers: { 'Authorization': 'Bearer smoke-test-key-123' }
            }).catch(e => e));
        }
        const results = await Promise.all(tasks);
        const tooMany = results.filter(r => r.response && r.response.status === 429);
        if (tooMany.length === 0) throw new Error('Rate limit did not trigger (no 429s)');
        console.log(`      Successfully triggered ${tooMany.length} rate-limit blocks.`);
    });

    console.log(`\nRESULTS: ${passed}/${total} passed`);
    if (failed > 0) process.exit(1);
}

runSmokeTests();
