# Phase 4 Testing Guide - Proxy API Key Management

## ✅ Phase 4 Complete: Proxy Key Management

This guide will help you test the proxy key generation and management functionality.

---

## 🚀 Prerequisites

Make sure both servers are running:
- **Backend**: `http://localhost:3001` (should already be running)
- **Frontend**: `http://localhost:3000` (should already be running)

---

## 🧪 Test Flow

### Test 1: Navigate to Project Detail

1. Login to app (`http://localhost:3000`)
2. Go to Projects page
3. **Click on any project card** to open project detail

**Expected Result:**
- ✅ Redirected to `/projects/{projectId}`
- ✅ See breadcrumb: "Projects › {Project Name}"
- ✅ See project info card (description, created date, creator, ID)
- ✅ See "Proxy API Keys" section
- ✅ See stats: Active: 0, Revoked: 0, Total: 0
- ✅ See empty state: "No proxy keys yet"
- ✅ See "Create Key" button (if admin)

---

### Test 2: Create First Proxy Key (Admin Only)

1. On Project Detail page, click **"Create Your First Key"** or **"+ Create Key"**

**Expected Result:**
- ✅ Modal opens with title "Create Proxy API Key"
- ✅ Form has optional "Key Name" field

2. Leave name empty (test auto-naming)
3. Click **"Generate Key"**

**Expected Result:**
- ✅ Modal closes
- ✅ **BIG highlighted banner appears** with warning icon ⚠️
- ✅ Full key displayed: `sk-spendai-{64 hex chars}`
- ✅ Warning: "Save this key now! It will only be shown once."
- ✅ **Copy button** next to key
- ✅ Key appears in list below (masked: `sk-****abcd`)
- ✅ Status badge shows "ACTIVE" in green
- ✅ Stats updated: Active: 1, Total: 1

---

### Test 3: Copy Key to Clipboard

1. In the new key banner, click **"📋 Copy"** button

**Expected Result:**
- ✅ Button changes to "✓ Copied!" with green background
- ✅ Key is in clipboard (paste somewhere to verify)
- ✅ Button returns to normal after 2 seconds

2. Click **"I've saved it"** to dismiss banner

**Expected Result:**
- ✅ Banner disappears
- ✅ **Key is now ONLY visible in masked form** (`sk-****abcd`)
- ✅ **Full key can NEVER be retrieved again** ✅

---

### Test 4: Create Named Proxy Key

1. Click **"+ Create Key"**
2. Enter name: "Production Key"
3. Click **"Generate Key"**

**Expected Result:**
- ✅ New key banner appears with different key value
- ✅ Copy key to clipboard
- ✅ Dismiss banner
- ✅ Two keys now in list:
   - First key: shows masked value as name
   - Second key: shows "Production Key as name"
- ✅ Both show "ACTIVE" status
- ✅ Stats: Active: 2, Total: 2

---

### Test 5: Create Multiple Keys

Create 2 more keys with names:
- "Development Key"
- "Testing Key"

**Expected Result:**
- ✅ 4 total keys in list
- ✅ All marked as "ACTIVE"
- ✅ Each shows created timestamp
- ✅ Each shows "by {your-email}"
- ✅ Stats: Active: 4, Total: 4

---

### Test 6: Revoke a Proxy Key (Admin Only)

1. Find "Testing Key" in the list
2. Click **"Revoke"** button

**Expected Result:**
- ✅ Confirmation modal opens
- ✅ Warning message displayed
- ✅ Key name shown in red box: "Testing Key"

3. Click **"Revoke Key"**

**Expected Result:**
- ✅ Modal closes
- ✅ Key status changes to "REVOKED" (red badge)
- ✅ Key item background changes (slightly red tint)
- ✅ "Revoke" button removed for that key
- ✅ Shows revoked timestamp
- ✅ Stats updated: Active: 3, Revoked: 1, Total: 4

---

### Test 7: Key Display for Non-Admins (Developer Role)

If you have a developer account:

1. Login as **developer**
2. Navigate to a project  
3. View proxy keys section

**Expected Result:**
- ✅ Can see all keys (masked)
- ✅ Can see status (Active/Revoked)  
- ✅ **Cannot see "Create Key" button** ❌
- ✅ **Cannot see "Revoke" buttons** ❌
- ✅ Read-only access

---

### Test 8: Masked Key Format

Verify masked keys in the list:

**Expected Format:**
- `sk-****abcd` (shows last 4 chars of key)
- OR custom name if provided

**Security Check:**
- ✅ Full key **NEVER** displayed again after initial creation
- ✅ Only last 4 chars visible
- ✅ Database stores **HASHED** key (SHA-256), not plaintext

---

### Test 9: Navigation & Breadcrumbs

1. Click **"Projects"** in breadcrumb

**Expected Result:**
- ✅ Returns to Projects list page

2. Click project card again

**Expected Result:**
- ✅ Returns to Project Detail
- ✅ Keys persist and load correctly
- ✅ **New key banner does NOT reappear** (dismissed keys stay dismissed)

---

## 🔧 API Testing (Using cURL)

### Test Create Proxy Key API

```bash
# Replace YOUR_TOKEN with your JWT token
# Replace PROJECT_ID with actual project UUID

curl -X POST http://localhost:3001/api/proxy-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"projectId\":\"PROJECT_ID\",\"name\":\"API Test Key\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "key": {
    "id": "uuid-here",
    "organization_id": "org-uuid",
    "project_id": "project-uuid",
    "name": "API Test Key",
    "is_active": true,
    "created_at": "...",
    "keyValue": "sk-spendai-{64 hex chars}",  // ⚠️ ONLY SHOWN ONCE
    "masked": "sk-****abcd"
  },
  "warning": "Save this key now. It will not be shown again."
}
```

### Test Get Proxy Keys for Project

```bash
curl -X GET http://localhost:3001/api/proxy-keys/project/PROJECT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "keys": [
    {
      "id": "uuid-1",
      "name": "Production Key",
      "is_active": true,
      "created_at": "...",
      "masked": "sk-****abcd",
      "creator": {
        "id": "user-uuid",
        "email": "admin@test.com",
        "role": "admin"
      }
    },
    ...
  ]
}
```

### Test Revoke Proxy Key (Admin Only)

```bash
curl -X POST http://localhost:3001/api/proxy-keys/KEY_ID/revoke \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Proxy key revoked successfully",
  "key": {
    "id": "uuid",
    "is_active": false,
    "revoked_at": "..."
  }
}
```

### Test Developer Cannot Create Key (403)

If you have a developer token:

```bash
curl -X POST http://localhost:3001/api/proxy-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer DEVELOPER_TOKEN" \
  -d "{\"projectId\":\"PROJECT_ID\"}"
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Admin access required"
}
```

**Status Code:** 403 ✅

---

## 🔍 Verify in Supabase

1. Go to Supabase Dashboard → Table Editor → `proxy_keys`

**You should see:**
- All created keys
- `key_value` column contains **SHA-256 hash** (not plaintext) ✅
- `is_active` shows true/false
- `revoked_at` timestamp for revoked keys
- `organization_id` matches your org
- `project_id` matches the project

**Security Verification:**
```sql
-- In Supabase SQL Editor, check a key value
SELECT key_value FROM proxy_keys LIMIT 1;

-- Result should be a SHA-256 hash:
-- 'a1b2c3d4e5f6...' (64 hex characters, NOT 'sk-spendai-...')
```

✅ **Keys are stored HASHED, never in plaintext**

---

## 🔐 Security Features to Verify

### 1. Key Generation  
- ✅ Uses `crypto.randomBytes(32)` for 256-bit entropy
- ✅ Format: `sk-spendai-{64 hex chars}`
- ✅ Globally unique
- ✅ Non-guessable

### 2. Key Storage
- ✅ **Never stores plaintext key**
- ✅ Uses SHA-256 hashing (one-way)
- ✅ Database only contains hashes

### 3. Key Display
- ✅ Full key shown **ONLY ONCE** on creation
- ✅ Masked display thereafter (`sk-****abcd`)
- ✅ No API endpoint to retrieve full key

### 4. Key Lifecycle
- ✅ Created as `is_active = true`
- ✅ Revoked sets `is_active = false` + `revoked_at` timestamp
- ✅ Revoked keys cannot be reactivated (one-way operation)

### 5. Access Control
- ✅ Only admins can create keys (RBAC enforced)
- ✅ Only admins can revoke keys (RBAC enforced)
- ✅ Developers can VIEW keys (masked)
- ✅ Organization scoping enforced (RLS)

---

## ✨ UI/UX Features to Test

### New Key Banner
- ✅ Prominent gradient background
- ✅ Border highlighting
- ✅ Warning icon and message
- ✅ Monospace font for key display
- ✅ Copy button with visual feedback
- ✅ "I've saved it" dismiss button

### Key List
- ✅ Each key shows name, status badge, masked value
- ✅ Active badge: green
- ✅ Revoked badge: red
- ✅ Timestamps formatted nicely
- ✅ Creator email displayed
- ✅ Revoke button only on active keys
- ✅ No buttons for revoked keys

### Stats Display
- ✅ Active count (green)
- ✅ Revoked count (red)
- ✅ Total count
- ✅ Updates in real-time

### Responsive Design
1. Resize browser to mobile

**Expected:**
- ✅ Key items stack vertically
- ✅ Copy button stretches full width
- ✅ Actions stack below key info

---

##  🎯 Success Criteria

Phase 4 is successful if:

- ✅ Admin can generate proxy keys
- ✅ Keys are cryptographically secure (256-bit random)
- ✅ Keys are stored hashed (SHA-256, never plaintext)
- ✅ Full key shown ONLY ONCE on creation
- ✅ Keys displayed masked thereafter
- ✅ Admin can revoke keys
- ✅ Developer can view keys (read-only, no create/revoke)
- ✅ Stats display correctly
- ✅ Organization scoping works (RLS enforced)
- ✅ Role-based access control works
- ✅ Copy to clipboard works
- ✅ UI is polished and responsive

---

## 🐛 Troubleshooting

### "Admin access required" error
- Make sure you're logged in as admin
- First user of organization is always admin

### Keys not loading
- Check browser console for errors
- Verify project ID is valid
- Check backend logs

### Can't copy key
- Modern browsers require HTTPS for clipboard API
- Fallback: manually select and copy the key text

### Key not working (future Phase 5)
- Verify key is active (not revoked)
- Check key format is correct
- Ensure key hash matches in database

---

## 📊 What's Working Now

**Backend:**
- ✅ POST /api/proxy-keys (create - admin only)
- ✅ GET /api/proxy-keys/project/:projectId (list)
- ✅ GET /api/proxy-keys/:id (get one)
- ✅ POST /api/proxy-keys/:id/revoke (revoke - admin only)
- ✅ Secure key generation (crypto.randomBytes)
- ✅ SHA-256 hashing for storage
- ✅ Masked display helper

**Frontend:**
- ✅ Project Detail page
- ✅ Proxy Keys section with stats
- ✅ Create key modal (admin only)
- ✅ New key display banner (one-time)
- ✅ Copy to clipboard functionality
- ✅ Key list with masked display
- ✅ Revoke confirmation (admin only)
- ✅ Active/Revoked status badges
- ✅ Role-based UI rendering

**Security:**
- ✅ Keys generated with 256-bit entropy
- ✅ Keys stored as SHA-256 hashes
- ✅ Full key never retrievable after creation
- ✅ RBAC enforced (admin-only operations)
- ✅ Organization scoping (RLS)

---

## 🚫 What's NOT Built Yet

As requested, these are **excluded** from Phase 4:

❌ OpenAI integration  
❌ Request proxying  
❌ Key verification in proxy requests  
❌ Usage logging  
❌ Cost tracking  
❌ Dashboard analytics  

**These will be built in Phase 5.**

---

## ✅ Phase 4 Complete

If all tests pass, Phase 4 is complete! 🎉

**Confirm with me when ready for Phase 5!**
