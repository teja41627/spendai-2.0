# SpendAI 2.0 - Project Structure

## Directory Tree

```
spendai 2.0/
│
├── 📄 README.md                    # Main project overview
├── 📄 ARCHITECTURE.md              # System architecture & design
├── 📄 DATABASE_SCHEMA.md           # Database schema & RLS policies
├── 📄 TESTING.md                   # Testing guide
├── 📄 PHASE_2_COMPLETE.md          # Phase 2 summary
├── 📄 .gitignore                   # Git ignore rules
│
├── 📁 migrations/
│   └── 001_initial_schema.sql     # Database migration SQL
│
├── 📁 backend/                     # Node.js + Express API
│   ├── 📄 README.md               # Backend documentation
│   ├── 📄 package.json             # Dependencies
│   ├── 📄 .env                     # Environment variables (secret)
│   │
│   └── 📁 src/
│       ├── 📄 server.js            # Main server file
│       │
│       ├── 📁 config/
│       │   └── supabase.js         # Supabase client setup
│       │
│       ├── 📁 middleware/
│       │   └── auth.js             # JWT authentication middleware
│       │
│       ├── 📁 routes/
│       │   └── auth.js             # Authentication routes
│       │
│       └── 📁 services/
│           └── authService.js      # Authentication business logic
│
└── 📁 frontend/                    # React + Vite app
    ├── 📄 package.json             # Dependencies
    ├── 📄 vite.config.js            # Vite configuration
    ├── 📄 index.html                # HTML template
    ├── 📄 .env                      # Environment variables (secret)
    │
    └── 📁 src/
        ├── 📄 main.jsx              # React entry point
        ├── 📄 App.jsx               # Main app with routing
        ├── 📄 index.css             # Global styles & design system
        │
        ├── 📁 pages/
        │   ├── Signup.jsx           # Signup page component
        │   ├── Login.jsx            # Login page component
        │   ├── Dashboard.jsx        # Dashboard page component
        │   ├── Auth.css             # Auth pages styles
        │   └── Dashboard.css        # Dashboard styles
        │
        └── 📁 services/
            └── api.js               # API client & auth service
```

## File Counts

- **Documentation**: 5 markdown files
- **Backend**: 6 JavaScript files
- **Frontend**: 8 JSX/CSS files
- **Config**: 4 config files (.env, vite.config.js, package.json)
- **Total Lines of Code**: ~2,500+ lines

## Technology Breakdown

### Backend Stack
```
Node.js + Express
├── @supabase/supabase-js  → Database & Auth
├── cors                    → Cross-origin requests
├── dotenv                  → Environment variables
├── uuid                    → UUID generation
└── nodemon                 → Dev auto-reload
```

### Frontend Stack
```
React + Vite
├── react                   → UI library
├── react-router-dom        → Routing
├── axios                   → HTTP client
├── @supabase/supabase-js   → Supabase client
└── @vitejs/plugin-react    → Vite React plugin
```

### Database
```
PostgreSQL (Supabase)
├── organizations           → Org data
├── users                   → User profiles
├── projects                → AI projects (ready)
├── proxy_keys              → API keys (ready)
└── usage_logs              → Usage tracking (ready)
```

## Key Features by File

### Backend

**`server.js`**
- Express app setup
- CORS & middleware config
- Route registration
- Error handling
- Server startup

**`config/supabase.js`**
- Admin client (service role)
- Standard client (anon key)
- Client configuration

**`middleware/auth.js`**
- JWT token verification
- User attachment to request
- Admin role checking

**`routes/auth.js`**
- POST `/api/auth/signup`
- POST `/api/auth/login`
- GET `/api/auth/me`
- Input validation
- Error responses

**`services/authService.js`**
- Signup with org creation
- Login with session
- Token verification
- Rollback on errors

### Frontend

**`App.jsx`**
- React Router setup
- Protected routes
- Public routes
- Route guards

**`pages/Signup.jsx`**
- Signup form
- Validation
- Organization name input
- Success/error handling

**`pages/Login.jsx`**
- Login form
- Session management
- Error handling

**`pages/Dashboard.jsx`**
- User profile display
- Organization info
- Logout functionality

**`services/api.js`**
- Axios instance
- Request interceptor (auth token)
- Response interceptor (401 handling)
- Auth service methods

**`index.css`**
- CSS design system
- Dark theme
- Gradients & animations
- Utility classes
- Responsive styles

## Environment Variables

### Backend `.env`
```
SUPABASE_URL              → Supabase project URL
SUPABASE_ANON_KEY         → Public anon key
SUPABASE_SERVICE_KEY      → Secret service role key
PORT                      → Server port (3001)
NODE_ENV                  → Environment (development)
OPENAI_API_KEY            → (Not used yet)
```

### Frontend `.env`
```
REACT_APP_SUPABASE_URL        → Supabase project URL
REACT_APP_SUPABASE_ANON_KEY   → Public anon key
REACT_APP_API_URL             → Backend URL (http://localhost:3001)
```

## Running Servers

### Terminal 1: Backend
```bash
cd backend
npm run dev

# Output:
# 🚀 SpendAI Backend Server
# 🌐 Server running on: http://localhost:3001
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev

# Output:
# ➜  Local:   http://localhost:3000/
```

## API Endpoints

**Authentication:**
- `POST /api/auth/signup` → Create account
- `POST /api/auth/login` → Get session
- `GET /api/auth/me` → Get user profile (protected)

**Health:**
- `GET /health` → Server status

## Frontend Pages

**Public Routes:**
- `/` → Redirects to `/login`
- `/signup` → Signup page
- `/login` → Login page

**Protected Routes:**
- `/dashboard` → User dashboard (requires auth)

## Database Tables (Supabase)

**Created:**
- `organizations` (5 columns, 1 index)
- `users` (6 columns, 2 indexes)
- `projects` (7 columns, 2 indexes) *
- `proxy_keys` (9 columns, 4 indexes) *
- `usage_logs` (14 columns, 5 indexes) *

\* Ready for future phases

**RLS Policies:**
- 12 policies across 5 tables
- Organization-based isolation
- Role-based access control

## Design System (CSS)

**Colors:**
- Primary: `#6366f1` (Indigo)
- Secondary: `#ec4899` (Pink)
- Background: `#0f172a` (Dark blue)
- Surface: `#1e293b` (Slate)

**Features:**
- CSS custom properties
- Gradients
- Glassmorphism
- Smooth animations
- Dark theme
- Responsive breakpoints

## What's Working

✅ User signup  
✅ Organization creation  
✅ User login  
✅ JWT sessions  
✅ Protected routes  
✅ Dashboard display  
✅ Logout  
✅ Error handling  
✅ Form validation  
✅ Responsive UI  

## What's Next

After testing, we'll build:
1. Project management
2. Proxy key generation
3. OpenAI proxy engine
4. Usage tracking
5. Dashboard analytics

---

**Last Updated:** January 27, 2026  
**Status:** Phase 2 Complete ✅
