# SpendOnline 2.0 (SpendAI) - System Architecture

## Overview
A B2B AI spend tracking and proxy platform that helps organizations monitor, control, and attribute LLM API costs across teams and projects.

**Target Users**: Startups and mid-market companies (5-500 employees)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATIONS                       │
│                   (Using Proxy API Keys)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ API Requests with Proxy Key
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SPENDAI BACKEND                             │
│                    (Node.js + Express)                           │
│                                                                  │
│  ┌────────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Auth Layer   │  │ Proxy Engine │  │  Usage Logger    │   │
│  │  - JWT Verify  │  │ - Validate   │  │ - Track Tokens   │   │
│  │  - RLS Rules   │  │ - Forward    │  │ - Calculate Cost │   │
│  └────────────────┘  └──────────────┘  └──────────────────┘   │
│                                                                  │
└──────┬────────────────────────────────┬────────────────────────┘
       │                                │
       │                                │ Forward to OpenAI
       ▼                                ▼
┌─────────────────┐           ┌────────────────────┐
│   SUPABASE      │           │   OPENAI API       │
│   - PostgreSQL  │           │   - GPT Models     │
│   - Auth        │           │   - Responses      │
│   - RLS         │           └────────────────────┘
└─────────────────┘

       ▲
       │ Auth & Data Queries
       │
┌──────┴──────────────────────────────────────────────────────────┐
│                      WEB DASHBOARD                               │
│                          (React)                                 │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐     │
│  │    Login     │  │   Projects   │  │   Usage Stats    │     │
│  │   Signup     │  │  Management  │  │   Cost Tracking  │     │
│  └──────────────┘  └──────────────┘  └──────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework**: React (plain React, no Next.js)
- **Styling**: Basic CSS with lightweight utilities
- **Charts**: React Chart.js or Recharts
- **HTTP Client**: Axios or Fetch API
- **Auth**: Supabase Auth Client

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth + JWT
- **Proxy**: OpenAI API forwarding (built-in)

### Infrastructure
- **Database & Auth**: Supabase
- **Hosting**: TBD (Netlify/Vercel for frontend, Railway/Render for backend)

---

## Key Components

### 1. Authentication & Authorization
- **Organization-based authentication**
- Each user belongs to ONE organization
- Auto-create organization on first signup
- Roles: `admin` (org owner) and `developer` (team member)
- Row Level Security (RLS) enforced at database level

### 2. Project Management
- Organizations create projects
- Each project represents an application/service using AI
- Projects have unique proxy API keys

### 3. Proxy Engine
- Single API endpoint: `/api/v1/proxy`
- Validates incoming proxy API key
- Forwards request to OpenAI API
- Logs request metadata (tokens, cost, timestamp)
- Returns OpenAI response transparently

### 4. Usage & Cost Tracking
- Every API call logged to `usage_logs` table
- Track: tokens_in, tokens_out, cost, model, timestamp
- Attributed to: organization, project, api_key
- No background jobs (synchronous logging)

### 5. Dashboard
- View total spend over time
- View usage per project
- Simple tables and basic charts
- No real-time updates (refresh-based)

---

## Data Flow

### User Signup/Login Flow
1. User signs up via web dashboard
2. Supabase Auth creates user account
3. Backend creates organization automatically
4. User assigned as `admin` role
5. JWT token returned to frontend

### Proxy Request Flow
1. Client app makes API request with proxy key in header
2. Backend validates proxy key → gets project & org
3. Backend forwards request to OpenAI API
4. OpenAI responds
5. Backend logs usage (tokens, cost) to database
6. Backend returns OpenAI response to client

### Dashboard View Flow
1. User logs in to web dashboard
2. Frontend fetches projects for organization
3. Frontend fetches usage logs for selected date range
4. Frontend aggregates and displays:
   - Total spend
   - Spend per project
   - Usage trends

---

## Security Model

### Authentication
- Supabase handles user authentication (JWT)
- Backend verifies JWT on protected routes
- Proxy keys are UUID-based, stored hashed (optional for MVP)

### Authorization
- Row Level Security (RLS) policies ensure:
  - Users only see data from their organization
  - Admins can manage projects
  - Developers can view usage

### Proxy Security
- Proxy API keys validated against database
- Rate limiting (future: not in MVP)
- OpenAI keys stored encrypted in backend environment

---

## MVP Scope

### Included
✅ Organization signup/login  
✅ Project creation  
✅ Proxy API key generation/revocation  
✅ OpenAI request proxying  
✅ Usage and cost tracking  
✅ Basic dashboard (tables + charts)  

### Explicitly Excluded
❌ Budget alerts or limits  
❌ Multi-provider support (only OpenAI)  
❌ Notifications (Slack/email)  
❌ Advanced RBAC  
❌ Billing/invoicing  
❌ Cost optimization suggestions  

---

## Deployment Strategy

### Development
- Frontend: `npm run dev` (local React)
- Backend: `npm run dev` (local Express)
- Database: Supabase cloud

### Production (Future)
- Frontend: Netlify or Vercel
- Backend: Railway, Render, or AWS
- Database: Supabase (production tier)

---

## Next Steps
1. ✅ Define database schema
2. ✅ Set up project structure
3. ✅ Implement authentication
4. Build proxy engine
5. Build dashboard
6. Test end-to-end flow
