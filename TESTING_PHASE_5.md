# Phase 5 Testing Guide - OpenAI Proxy Engine

## ✅ Phase 5 Complete: OpenAI Proxy Engine (Backend Only)

This guide will help you test the OpenAI-compatible proxy functionality.

---

## 🚀 Prerequisites

### 1. Run Database Migration

**Go to Supabase SQL Editor and run:**
```sql
-- File: migrations/002_add_openai_key.sql
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS openai_api_key TEXT;
```

### 2. Add OpenAI API Key to Your Organization

**In Supabase Table Editor:**
1. Open `organizations` table
2. Find your organization row
3. Edit the `openai_api_key` column
4. Paste your real OpenAI API key (e.g., `sk-proj-...`)
5. Save

**OR use SQL:**
```sql
UPDATE organizations 
SET openai_api_key = 'sk-proj-YOUR_ACTUAL_OPENAI_KEY_HERE'
WHERE id = 'your-org-id-here';
```

### 3. Ensure Servers are Running

- **Backend**: `http://localhost:3001` ✅
- **Frontend**: `http://localhost:3000` (not needed for Phase 5)

---

## 🧪 Test Flow

### Test 1: Proxy Health Check

**Request:**
```bash
curl http://localhost:3001/v1/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "SpendAI OpenAI Proxy",
  "version": "1.0.0",
  "endpoints": {
    "chat_completions": "/v1/chat/completions"
  }
}
```

✅ **Pass Criteria**: Returns 200 OK with service info

---

### Test 2: Chat Completion with Valid Proxy Key

**Setup:**
1. Login to SpendAI frontend
2. Navigate to a project
3. Create a proxy key
4. **COPY THE FULL KEY** (e.g., `sk-spendai-a1b2c3d4...`)

**Request:**
```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SPENDAI_PROXY_KEY_HERE" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "Say hello in one word"}
    ]
  }'
```

**Replace** `YOUR_SPENDAI_PROXY_KEY_HERE` with your actual proxy key!

**Expected Response:**
```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-3.5-turbo-0125",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello!"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 13,
    "completion_tokens": 2,
    "total_tokens": 15
  }
}
```

✅ **Pass Criteria:**
- Returns 200 OK
- Response format identical to OpenAI API
- Contains `choices`, `usage`, `id`, etc.
- Request successfully proxied to OpenAI

---

### Test 3: Invalid Proxy Key (401)

**Request:**
```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-invalid-fake-key-12345" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Test"}]
  }'
```

**Expected Response:**
```json
{
  "error": {
    "message": "Invalid or revoked proxy key",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}
```

**Status Code:** 401 Unauthorized

✅ **Pass Criteria**: Rejects invalid keys with proper error

---

### Test 4: Missing Authorization Header (401)

**Request:**
```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Test"}]
  }'
```

**Expected Response:**
```json
{
  "error": {
    "message": "Missing or invalid Authorization header. Use: Authorization: Bearer <proxy_key>",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}
```

**Status Code:** 401 Unauthorized

✅ **Pass Criteria**: Requires Authorization header

---

### Test 5: Revoked Proxy Key (401)

**Setup:**
1. Go to project detail page
2. Revoke one of your proxy keys
3. Try to use the revoked key

**Request:**
```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_REVOKED_KEY_HERE" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Test"}]
  }'
```

**Expected Response:**
```json
{
  "error": {
    "message": "Invalid or revoked proxy key",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}
```

**Status Code:** 401 Unauthorized

✅ **Pass Criteria**: Revoked keys are rejected

---

### Test 6: Invalid Request Body (400)

**Request:**
```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_VALID_KEY_HERE" \
  -d '{
    "messages": [{"role": "user", "content": "Test"}]
  }'
```

**(Missing `model` field)**

**Expected Response:**
```json
{
  "error": {
    "message": "model is required",
    "type": "invalid_request_error",
    "code": "invalid_request"
  }
}
```

**Status Code:** 400 Bad Request

✅ **Pass Criteria**: Validates request structure

---

### Test 7: OpenAI Error Pass-Through

**Request with invalid model:**
```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_VALID_KEY_HERE" \
  -d '{
    "model": "invalid-model-name",
    "messages": [{"role": "user", "content": "Test"}]
  }'
```

**Expected Response:**
```json
{
  "error": {
    "message": "The model `invalid-model-name` does not exist...",
    "type": "invalid_request_error",
    "param": "model",
    "code": "model_not_found"
  }
}
```

**Status Code:** 404 (from OpenAI)

✅ **Pass Criteria**: OpenAI errors passed through transparently

---

### Test 8: Streaming Support (If Implemented)

**Request:**
```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_VALID_KEY_HERE" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Count to 3"}],
    "stream": true
  }'
```

**Expected:**
- Streaming response (SSE format)
- `data: {...}` chunks
- `data: [DONE]` at end

**Note:** Phase 5 basic implementation may not support streaming yet.

---

## 🔧 Advanced Testing

### Test with Python OpenAI SDK

**Install:**
```bash
pip install openai
```

**Test Script:**
```python
from openai import OpenAI

# Point to SpendAI proxy
client = OpenAI(
    api_key="YOUR_SPENDAI_PROXY_KEY",
    base_url="http://localhost:3001/v1"
)

response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "user", "content": "Say hello!"}
    ]
)

print(response.choices[0].message.content)
```

**Expected:**
- ✅ Works identically to OpenAI
- ✅ No code changes needed (drop-in replacement)

---

### Test with Node.js OpenAI SDK

**Install:**
```bash
npm install openai
```

**Test Script:**
```javascript
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: 'YOUR_SPENDAI_PROXY_KEY',
  baseURL: 'http://localhost:3001/v1'
});

async function test() {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Say hello!' }]
  });
  
  console.log(response.choices[0].message.content);
}

test();
```

**Expected:**
- ✅ Drop-in compatible
- ✅ No SDK modifications needed

---

## 🔍 Verify in Backend Logs

Check your backend console output:

**Look for:**
```
🤖 OpenAI Proxy (Drop-in Compatible):
   POST http://localhost:3001/v1/chat/completions
   GET  http://localhost:3001/v1/health
```

**During requests, you should see:**
- No errors
- Request processing logs (if enabled)
- OpenAI API calls being made

---

## 🔐 Security Verification

### 1. Key Validation
- ✅ Invalid keys rejected (401)
- ✅ Revoked keys rejected (401)
- ✅ HMAC-SHA256 hashing used
- ✅ Constant-time comparison used

### 2. Organization Isolation
**Test:**
1. Create proxy key for Project A (Org 1)
2. Try to use it for requests
3. Verify it uses Org 1's OpenAI key (check logs)

✅ **Pass**: Each org uses its own OpenAI key

### 3. Error Handling
- ✅ Invalid request body: 400
- ✅ Missing auth: 401
- ✅ Invalid key: 401
- ✅ OpenAI errors: Pass-through status codes
- ✅ Timeout: 504

---

## 📊 What's Working

**Proxy Flow:**
1. ✅ Client sends request with SpendAI proxy key
2. ✅ Proxy validates key (HMAC + constant-time)
3. ✅ Proxy identifies organization & project
4. ✅ Proxy fetches org's OpenAI API key
5. ✅ Proxy forwards request to OpenAI
6. ✅ Proxy returns OpenAI response (transparent)

**OpenAI Compatibility:**
- ✅ Same request format
- ✅ Same response format
- ✅ Same error format
- ✅ Drop-in SDK compatible
- ✅ `/v1/chat/completions` endpoint

**Security:**
- ✅ Proxy key validation
- ✅ Revoked key rejection
- ✅ Organization isolation
- ✅ Proper error messages

---

## 🚫 What's NOT Built Yet

As per Phase 5 scope, these are **excluded**:

❌ Usage logging (will be Phase 6)  
❌ Token counting (will be Phase 6)  
❌ Cost calculation (will be Phase 6)  
❌ Rate limiting (future phase)  
❌ Request retries (future phase)  
❌ Frontend changes (none needed!)  

---

## ✅ Success Criteria

Phase 5 is successful if:

- ✅ Health check endpoint works
- ✅ Chat completion proxies to OpenAI
- ✅ Response format identical to OpenAI
- ✅ Invalid keys rejected (401)
- ✅ Revoked keys rejected (401)
- ✅ OpenAI errors passed through
- ✅ Works with OpenAI Python/Node SDKs
- ✅ Organization's OpenAI key used correctly
- ✅ No logging/tracking (as expected)

---

## 🐛 Troubleshooting

### "Organization OpenAI API key not configured"
- Go to Supabase → `organizations` table
- Add your OpenAI API key to `openai_api_key` column

### "Invalid or revoked proxy key"
- Verify key is correct (copy from UI when created)
- Check key format starts with `sk-spendai-`
- Ensure key is not revoked

### "OpenAI request timeout"
- Check internet connection
- Verify OpenAI API is accessible
- Check firewall settings

### OpenAI returns 401
- Your org's OpenAI API key is invalid
- Update `openai_api_key` in organizations table
- Get new key from OpenAI dashboard

### Response not matching OpenAI format
- Check backend logs for errors
- Verify request payload
- Test directly with OpenAI to compare

---

## 🎯 Next Phase Preview

**Phase 6 will add:**
- Usage logging (tokens, model, timestamps)
- Cost calculation (per request)
- Database storage of usage logs
- Dashboard analytics
- Cost tracking per project/org

**For now, proxy works but doesn't track anything!**

---

## ✅ Phase 5 Complete

If all tests pass, Phase 5 is complete! 🎉

**Confirm with me when ready for Phase 6!**
