# SpendOnline 2.0 (SpendAI)

> A B2B AI spend tracking and proxy platform that helps organizations monitor, control, and attribute LLM API costs across teams and projects.

---

## 📋 Project Status

**Current Phase**: ✅ Phase 6 Complete - Usage Logging & Cost Tracking (Finance-Grade Ledger!)

**Completed:**
- ✅ Phase 1: System Architecture & Database Design
- ✅ Phase 2: Authentication (Org-based signup, login, JWT sessions)
- ✅ Phase 3: Project Management (CRUD operations, role-based access)
- ✅ Phase 4: Proxy Key Management (HMAC-SHA256, constant-time comparison)
- ✅ Phase 5: OpenAI Proxy Engine (Drop-in compatible, security hardened)
- ✅ Phase 6: Usage Logging & Cost Tracking (Automatic ledger, pricing engine)
- ✅ Phase 7: Frontend Dashboards & Spend Analytics (Visual insights)
- ✅ Phase 8: Budgets & Spend Alerts (Governance & notifications)
- ✅ Phase 9A: Production Readiness & Hardening (Observability & safeguards)
- ✅ Phase 9B: Final Deployment & Smoke Test (Live Verification)

**SpendAI 2.0 RELEASED:**
- 🛡️ **Hardened Proxy**: Key-based rate limiting & safe error handling.
- 📊 **Governance**: Multi-level budgeting with advisory threshold alerts.
- 🧪 **Verified**: Continuous smoke testing for health, readiness, and traffic limits.
- 🚀 **Production-Ready**: One-click deployment simulation passed.

**Status**: 🌟 **PROJECT COMPLETE**
[View Final Results](./PHASE_9B_COMPLETE.md)

---

## 🏗️ Architecture

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for detailed system design.

**Tech Stack:**
- **Frontend**: React + Basic CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth

---

## 🗄️ Database Setup

### Step 1: Run Migration in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/jexipkocsmrqdzomqddy
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of [`migrations/001_initial_schema.sql`](./migrations/001_initial_schema.sql)
5. Paste into the SQL editor
6. Click **Run** or press `Ctrl+Enter`

You should see:
```
Success. No rows returned
```

### Step 2: Verify Tables Were Created

Run this query in the SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('organizations', 'users', 'projects', 'proxy_keys', 'usage_logs')
ORDER BY table_name;
```

**Expected Output:**
```
organizations
projects
proxy_keys
usage_logs
users
```

---

## 🔑 Environment Variables

### Backend (Node.js)
Create `backend/.env`:
```env
# Supabase
SUPABASE_URL=https://jexipkocsmrqdzomqddy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpleGlwa29jc21ycWR6b21xZGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDg4OTUsImV4cCI6MjA4NTA4NDg5NX0.un6HrQOPFwsLnkQt1MC9SuhPC5bB49y-cY-RtTUx344
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpleGlwa29jc21ycWR6b21xZGR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUwODg5NSwiZXhwIjoyMDg1MDg0ODk1fQ.hjKv5xJXdTZPoWvcCty-LHklNn2wDv4WnxuhKP5DGQQ

# OpenAI
OPENAI_API_KEY=your-openai-key-here

# Server
PORT=3001
NODE_ENV=development
```

### Frontend (React)
Create `frontend/.env`:
```env
REACT_APP_SUPABASE_URL=https://jexipkocsmrqdzomqddy.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpleGlwa29jc21ycWR6b21xZGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDg4OTUsImV4cCI6MjA4NTA4NDg5NX0.un6HrQOPFwsLnkQt1MC9SuhPC5bB49y-cY-RtTUx344
REACT_APP_API_URL=http://localhost:3001
```

---

## 🚀 MVP Features

### Included in MVP
- ✅ Organization-based signup & login
- ✅ Auto-create organization on signup
- ✅ Admin and Developer roles
- ✅ Project management
- ✅ Proxy API key generation/revocation
- ✅ OpenAI request proxying
- ✅ Usage and cost tracking
- ✅ Basic dashboard (tables + charts)

### Explicitly Excluded
- ❌ Budget alerts/limits
- ❌ Multi-provider support
- ❌ Notifications (Slack/email)
- ❌ Advanced RBAC
- ❌ Billing/invoicing
- ❌ Cost optimization suggestions

---

## 📁 Project Structure

```
spendai-2.0/
├── ARCHITECTURE.md          # System architecture
├── DATABASE_SCHEMA.md       # Database design
├── README.md                # This file
├── migrations/              # SQL migration files
│   └── 001_initial_schema.sql
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── server.js
│   ├── package.json
│   └── .env
└── frontend/                # React app
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   └── App.js
    ├── package.json
    └── .env
```

---

## 🔐 Security Model

- **Authentication**: Supabase Auth with JWT
- **Authorization**: Row Level Security (RLS) policies
- **Multi-tenancy**: Organization-based isolation
- **Proxy Keys**: UUID-based keys (hashed in production)

See [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) for RLS policies.

---

## 📊 Database Schema Overview

### Core Tables
1. **organizations** - Organization details
2. **users** - User profiles with roles (extends `auth.users`)
3. **projects** - AI projects per organization
4. **proxy_keys** - API keys for proxying
5. **usage_logs** - Request logs (tokens, cost, metadata)

See [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) for full schema.

---

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Setup (Coming Next)
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Run backend
cd backend
npm run dev

# Run frontend
cd frontend
npm start
```

---

## 📝 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Complete system design
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Database schema and RLS policies

---

## 🎯 Next Steps

**Immediate:**
1. Run database migration in Supabase
2. Build authentication backend (signup, login)
3. Build authentication frontend (signup, login UI)

**After Authentication:**
4. Build project management
5. Build proxy engine
6. Build dashboard

---

**Last Updated**: January 27, 2026
