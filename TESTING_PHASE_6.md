# Phase 6 Testing Guide - Usage Logging & Cost Tracking

## ✅ Phase 6 Complete: Finance-Grade Usage Ledger

This guide will help you test the usage logging and cost calculation functionality.

---

## 🚀 Prerequisites

### 1. Verify Database Schema

Ensure `usage_logs` table exists from Phase 2 migration:
```sql
SELECT * FROM usage_logs LIMIT 0;
```

**Expected:** Table exists with columns:
- `id`, `organization_id`, `project_id`, `proxy_key_id`
- `model`, `provider`
- `tokens_prompt`, `tokens_completion`, `tokens_total` (generated)
- `cost_usd`, `request_id`, `status`
- `created_at`

### 2. Ensure Servers are Running

- **Backend**: `http://localhost:3001` ✅
- Have a valid proxy key ready

---

## 🧪 Test Flow

### Test 1: Successful Request → Usage Logged

**Make a request:**
```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PROXY_KEY_HERE" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "Say hello in one word"}
    ]
  }'
```

**Expected Response:**
```json
{
  "id": "chatcmpl-...",
  "model": "gpt-3.5-turbo-0125",
  "choices": [...],
  "usage": {
    "prompt_tokens": 13,
    "completion_tokens": 2,
    "total_tokens": 15
  }
}
```

**Verify in Backend Logs:**
```
[<request_id>] Cost breakdown: {
  "model": "gpt-3.5-turbo-0125",
  "usage": {
    "prompt_tokens": 13,
    "completion_tokens": 2,
    "total_tokens": 15
  },
  "costs": {
    "prompt_cost_usd": 0.0000065,
    "completion_cost_usd": 0.000003,
    "total_cost_usd": 0.0000095
  }
}
[<request_id>] Usage logged: gpt-3.5-turbo-0125, 15 tokens, $0.000010
```

**Verify in Database:**
```sql
SELECT 
  id,
  request_id,
  model,
  tokens_prompt,
  tokens_completion,
  tokens_total,
  cost_usd,
  price_prompt_per_million,
  price_completion_per_million,
  currency,
  status,
  created_at
FROM usage_logs
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**
```
id                           | <uuid>
request_id                   | <spendai_request_id>
model                        | gpt-3.5-turbo-0125
tokens_prompt                | 13
tokens_completion            | 2
tokens_total                 | 15
cost_usd                     | 0.000010
price_prompt_per_million     | 0.50
price_completion_per_million | 1.50
currency                     | USD
status                       | success
created_at                   | <timestamp>
```

---

### Test 9: Missing Usage Object Guard

**Scenario:** OpenAI returns a response without the `usage` object (e.g. some streaming edge cases or specialized errors).

**Method:** Manually trigger the service with a mock response.

**Expected Behavior:**
- Backend logs a warning: `[request-id] Skipping usage logging: 'usage' object missing in OpenAI response.`
- No row is inserted into `usage_logs`.
- Client still receives the original response.

✅ **Pass Criteria:** System handles missing `usage` gracefully without crashing or creating corrupted log rows.

✅ **Pass Criteria:**
- Usage log created in database
- Token counts match OpenAI response
- Cost calculated correctly
- Status = 'success'

---

### Test 2: Multiple Requests → Multiple Logs

**Make 3 requests with different prompts:**

```bash
# Request 1
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": "Hi"}]}'

# Request 2
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": "Tell me a joke"}]}'

# Request 3
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "Explain AI"}]}'
```

**Verify in Database:**
```sql
SELECT 
  request_id,
  model,
  tokens_total,
  cost_usd,
  created_at
FROM usage_logs
ORDER BY created_at DESC
LIMIT 3;
```

**Expected:** 3 separate rows, one per request

✅ **Pass Criteria:**
- Each request creates one log entry
- No aggregation
- Distinct `request_id` for each
- Different token counts and costs

---

### Test 3: Cost Calculation Accuracy

**Test GPT-3.5-Turbo Pricing:**

Pricing: $0.50/1M input tokens, $1.50/1M output tokens

**Request:**
```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "Write a 50-word essay on AI"}
    ]
  }'
```

**Let's say OpenAI returns:**
- `prompt_tokens`: 20
- `completion_tokens`: 60
- Total: 80 tokens

**Manual Calculation:**
```
Prompt cost   = (20 / 1,000,000) * $0.50 = $0.00001
Completion cost = (60 / 1,000,000) * $1.50 = $0.00009
Total cost    = $0.00010
```

**Verify in Database:**
```sql
SELECT cost_usd FROM usage_logs ORDER BY created_at DESC LIMIT 1;
```

**Expected:** `cost_usd = 0.000100` (6 decimal places)

✅ **Pass Criteria:** Cost matches manual calculation

---

### Test 4: Different Model Pricing

**Test GPT-4 (Higher Cost):**

Pricing: $30/1M input, $60/1M output

```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hi"}]
  }'
```

**OpenAI might return:**
- `prompt_tokens`: 10
- `completion_tokens`: 5
- Total: 15 tokens

**Manual Calculation:**
```
Prompt cost   = (10 / 1,000,000) * $30 = $0.0003
Completion cost = (5 / 1,000,000) * $60 = $0.0003
Total cost    = $0.0006
```

**Verify:** `cost_usd = 0.000600`

✅ **Pass Criteria:** GPT-4 costs more than GPT-3.5 for same token count

---

### Test 5: Failed Request → NOT Logged

**Make an invalid request (missing model):**
```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Test"}]
  }'
```

**Expected Response:** 400 Bad Request

**Verify in Database:**
```sql
SELECT COUNT(*) FROM usage_logs WHERE status = 'error';
```

**Expected:** 0 (no error logs)

✅ **Pass Criteria:** Failed requests are NOT logged

---

### Test 6: Invalid Model → NOT Logged

**Request with unsupported model:**
```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5-nonexistent",
    "messages": [{"role": "user", "content": "Test"}]
  }'
```

**Expected Response:** 400 Bad Request (model validation)

**Verify:** No usage log created

✅ **Pass Criteria:** Invalid models don't create logs

---

### Test 7: OpenAI Error → NOT Logged

**Use invalid API key in organizations table:**
```sql
UPDATE organizations 
SET openai_api_key = 'sk-invalid-fake-key'
WHERE id = 'your-org-id';
```

**Make request:**
```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Authorization: Bearer YOUR_PROXY_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": "Hi"}]}'
```

**Expected Response:** 401 from OpenAI (invalid API key)

**Verify:** No usage log created (status != 200)

✅ **Pass Criteria:** OpenAI errors don't create logs

**Restore your real OpenAI key after this test!**

---

### Test 8: Request ID Correlation

**Make a request and capture the request ID:**
```bash
curl -v -X POST http://localhost:3001/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": "Hi"}]}'
```

**In response headers, find:**
```
x-spendai-request-id: 550e8400-e29b-41d4-a716-446655440000
```

**Verify in Database:**
```sql
SELECT * FROM usage_logs 
WHERE request_id = '550e8400-e29b-41d4-a716-446655440000';
```

**Expected:** Exactly one row with that request ID

✅ **Pass Criteria:** Request IDs match between header and database

---

## 🔍 Verify Pricing Table

**Check all models have pricing:**

```javascript
// In Node.js console or test script
const pricingService = require('./backend/src/services/pricingService');

console.log('Supported models:', pricingService.getSupportedModels());
console.log('\nPricing table:');
console.log(JSON.stringify(pricingService.getPricingTable(), null, 2));

// Test calculation
const cost = pricingService.calculateCost('gpt-3.5-turbo', 100, 50);
console.log('\nCost for 100 input + 50 output tokens:', cost);

// Get breakdown
const breakdown = pricingService.getCostBreakdown('gpt-4', 1000, 500);
console.log('\nGPT-4 breakdown:', JSON.stringify(breakdown, null, 2));
```

**Expected Output:**
```json
{
  "model": "gpt-4",
  "pricing": {
    "prompt_per_1m": 30,
    "completion_per_1m": 60
  },
  "usage": {
    "prompt_tokens": 1000,
    "completion_tokens": 500,
    "total_tokens": 1500
  },
  "costs": {
    "prompt_cost_usd": 0.03,
    "completion_cost_usd": 0.03,
    "total_cost_usd": 0.06
  }
}
```

---

## 📊 Database Queries for Validation

### Total Usage by Model
```sql
SELECT 
  model,
  COUNT(*) as request_count,
  SUM(tokens_prompt) as total_prompt_tokens,
  SUM(tokens_completion) as total_completion_tokens,
  SUM(tokens_total) as total_tokens,
  SUM(cost_usd) as total_cost_usd
FROM usage_logs
GROUP BY model
ORDER BY total_cost_usd DESC;
```

### Usage by Project
```sql
SELECT 
  p.name as project_name,
  COUNT(ul.id) as request_count,
  SUM(ul.cost_usd) as total_spend_usd
FROM usage_logs ul
JOIN projects p ON ul.project_id = p.id
GROUP BY p.id, p.name
ORDER BY total_spend_usd DESC;
```

### Recent Usage
```sql
SELECT 
  request_id,
  model,
  tokens_total,
  cost_usd,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as timestamp
FROM usage_logs
ORDER BY created_at DESC
LIMIT 10;
```

### Cost Over Time (Daily)
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as requests,
  SUM(tokens_total) as total_tokens,
  SUM(cost_usd) as daily_cost_usd
FROM usage_logs
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## ✅ Success Criteria

Phase 6 is successful if:

- ✅ Successful requests create usage logs
- ✅ Failed requests do NOT create logs
- ✅ Token counts extracted from OpenAI response
- ✅ Cost calculated correctly (6 decimal precision)
- ✅ One log per request (no aggregation)
- ✅ Request IDs match between header and database
- ✅ All required fields populated
- ✅ `tokens_total` auto-calculated in DB
- ✅ Logs synchronized (written before response)
- ✅ Logging errors don't block client response

---

## 🐛 Troubleshooting

### No logs created
- Check backend console for errors
- Verify `usage_logs` table exists
- Check Supabase service key permissions

### Cost is 0.00
- Verify model has pricing in `pricingService.js`
- Check token counts in OpenAI response
- Look for pricing warnings in logs

### "Failed to log usage" errors
- Check Supabase connection
- Verify RLS policies allow insert
- Check `supabaseAdmin` client config

### Wrong cost calculation
- Verify pricing table matches OpenAI
- Check for typos in model names
- Manually calculate to verify formula

---

## 📈 What's Working

**Usage Logging:**
- ✅ Extract model and token counts from OpenAI
- ✅ Calculate cost using pricing table
- ✅ Write one row per successful request
- ✅ Include request ID for tracing
- ✅ Synchronized writes (before response)
- ✅ Error handling (doesn't block client)

**Pricing:**
- ✅ 9 models supported
- ✅ Accurate pricing (Jan 2026 rates)
- ✅ 6 decimal precision
- ✅ Separate prompt/completion pricing
- ✅ Cost breakdown for debugging

**Data Integrity:**
- ✅ Finance-grade ledger (immutable)
- ✅ All required fields populated
- ✅ No aggregation (raw logs)
- ✅ Request ID correlation
- ✅ Organization/project scoping

---

## 🚫 What's NOT Built Yet

As per Phase 6 scope, these are **excluded**:

❌ API endpoints to query logs  
❌ Frontend dashboards  
❌ Cost analytics/aggregations  
❌ Budgets and alerts  
❌ Rate limiting  
❌ Background jobs  

**These will be Phase 7 or later.**

---

## ✅ Phase 6 Complete

If all tests pass, Phase 6 is complete! 🎉

**Finance-grade usage ledger is now operational.**

**Next phase will add dashboards and analytics!**

**Confirm with me when ready for Phase 7!**
