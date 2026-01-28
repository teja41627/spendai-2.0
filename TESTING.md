# SpendAI - Testing Guide

## ✅ Phase 2 Complete: Authentication System

This guide will help you test the authentication flow that was just built.

---

## 🚀 Quick Start

### 1. Start Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
🚀 SpendAI Backend Server
📍 Environment: development
🌐 Server running on: http://localhost:3001
💚 Health check: http://localhost:3001/health
```

**Keep this terminal running!**

### 2. Start Frontend Server (New Terminal)

```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  press h to show help
```

Your browser should automatically open to `http://localhost:3000`

---

## 🧪 Test Flow

### Test 1: Health Check
Verify backend is running:
```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "SpendAI Backend is running",
  "timestamp": "2026-01-27...",
  "environment": "development"
}
```

---

### Test 2: Signup Flow (UI)

1. Open browser to `http://localhost:3000`
2. You should see the **Login** page
3. Click **"Create one"** link to go to Signup
4. Fill in the form:
   - **Organization Name**: `Test Corp`
   - **Work Email**: `admin@test.com`
   - **Password**: `password123`
   - **Confirm Password**: `password123`
5. Click **"Create Account"**

**Expected Result:**
- ✅ Green success message: "Account created successfully! Redirecting to login..."
- ✅ Auto-redirect to login page after 2 seconds

**What happened in the database:**
- New organization created: "Test Corp"
- New user created with email `admin@test.com`
- User assigned `admin` role
- Organization and user linked together

---

### Test 3: Login Flow (UI)

1. After signup redirect, you're on the **Login** page
2. Fill in credentials:
   - **Email**: `admin@test.com`
   - **Password**: `password123`
3. Click **"Sign In"**

**Expected Result:**
- ✅ Redirect to Dashboard
- ✅ See welcome message with organization name
- ✅ See user details displayed

**Dashboard should show:**
- Organization name: "Test Corp"
- Email: admin@test.com
- Role: admin badge
- Organization ID (UUID)

---

### Test 4: Logout Flow

1. On Dashboard, click **"Logout"** button (top right)

**Expected Result:**
- ✅ Redirect to Login page
- ✅ Session cleared from localStorage

---

### Test 5: Protected Route

1. Log out if you're logged in
2. Manually navigate to: `http://localhost:3000/dashboard`

**Expected Result:**
- ✅ Immediately redirected to `/login`
- ✅ Cannot access dashboard without authentication

---

### Test 6: Already Logged In

1. Log in to your account
2. Manually navigate to: `http://localhost:3000/login`

**Expected Result:**
- ✅ Immediately redirected to `/dashboard`
- ✅ Cannot access login page when already authenticated

---

## 🔧 API Testing (Using cURL)

### Test Signup API

```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test2@example.com\",\"password\":\"secure123\",\"organizationName\":\"Acme Inc\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "test2@example.com",
    "role": "admin",
    "organizationId": "org-uuid-here"
  },
  "organization": {
    "id": "org-uuid-here",
    "name": "Acme Inc"
  },
  "message": "User created successfully. Please use the login endpoint to get a session."
}
```

### Test Login API

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test2@example.com\",\"password\":\"secure123\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "test2@example.com",
    "role": "admin",
    "organizationId": "org-uuid"
  },
  "organization": {
    "id": "org-uuid",
    "name": "Acme Inc"
  },
  "session": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresAt": 1234567890
  }
}
```

### Test Protected Endpoint

```bash
# Replace YOUR_ACCESS_TOKEN with the token from login response
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "test2@example.com",
    "role": "admin",
    "organizationId": "org-uuid",
    "organization": {
      "id": "org-uuid",
      "name": "Acme Inc"
    }
  }
}
```

---

## 🔍 Verify in Supabase

1. Go to: https://supabase.com/dashboard/project/jexipkocsmrqdzomqddy
2. Click **Table Editor** (left sidebar)
3. Check these tables:

**organizations table:**
- Should see "Test Corp" and any other orgs you created

**users table:**
- Should see your user email
- `role` should be "admin"
- `organization_id` should match the org in organizations table

**auth.users table:**
- Click **Authentication** → **Users**
- Should see your user listed with email confirmed

---

## 🎯 What You've Built

✅ **Backend:**
- Node.js + Express API
- Supabase authentication integration
- Organization auto-creation on signup
- JWT token-based sessions
- Protected routes with middleware
- Proper error handling

✅ **Frontend:**
- React with Vite
- Beautiful, modern UI with animations
- Signup page with validation
- Login page with session management
- Dashboard with user profile
- Protected route guards
- Responsive design

✅ **Database:**
- Organizations table
- Users table with roles
- Row Level Security (RLS) enabled
- Proper foreign key relationships

---

## 🐛 Troubleshooting

### Backend won't start
- Check `.env` file exists in `backend/` folder
- Verify Supabase credentials are correct
- Make sure port 3001 is not in use

### Frontend won't start
- Check `.env` file exists in `frontend/` folder
- Verify port 3000 is not in use
- Clear browser cache and try again

### Signup fails with "Auth error"
- Verify database migration was run successfully
- Check Supabase project is not paused
- Ensure email is valid format

### Login fails with "Invalid credentials"
- Make sure you signed up first
- Check email/password are correct
- Try signing up with a new email

### Can't access dashboard
- Make sure you logged in successfully
- Check browser localStorage has `accessToken`
- Open DevTools → Application → Local Storage → `http://localhost:3000`

---

## 📊 Next Steps

After confirming authentication works:

1. **Project Management** (Next Phase)
   - Create projects within organization
   - List/view projects
   - Edit/delete projects

2. **Proxy Keys** (Following Phase)
   - Generate API keys per project
   - Revoke keys
   - View key status

3. **Proxy Engine** (Core Feature)
   - Forward requests to OpenAI
   - Track usage and cost
   - Log every request

4. **Dashboard** (Final Phase)
   - Usage charts
   - Cost breakdown
   - Project statistics

---

## 🎉 Success Criteria

You've successfully completed Phase 2 if:

- ✅ You can signup with a new account
- ✅ Organization is auto-created
- ✅ You can login and see your dashboard
- ✅ User role is "admin"
- ✅ Protected routes work correctly
- ✅ Logout clears session
- ✅ Data appears in Supabase tables

**Congratulations! Authentication is complete.** 🚀
