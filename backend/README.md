# SpendAI Backend - Authentication API

## Overview
Node.js + Express backend with Supabase authentication and organization management.

## Features
- ✅ User signup with auto-organization creation
- ✅ User login with JWT session
- ✅ JWT token verification
- ✅ Organization-based multi-tenancy
- ✅ Role-based access (admin, developer)

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Make sure `.env` file exists with:
```env
SUPABASE_URL=https://jexipkocsmrqdzomqddy.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
PORT=3001
NODE_ENV=development
```

### 3. Run Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:3001`

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and environment info.

### Authentication

#### Signup
```
POST /api/auth/signup
Content-Type: application/json

{
  "email": "admin@acme.com",
  "password": "secure123",
  "organizationName": "Acme Corp"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "admin@acme.com",
    "role": "admin",
    "organizationId": "org-uuid"
  },
  "organization": {
    "id": "org-uuid",
    "name": "Acme Corp"
  },
  "message": "User created successfully. Please use the login endpoint to get a session."
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@acme.com",
  "password": "secure123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "admin@acme.com",
    "role": "admin",
    "organizationId": "org-uuid"
  },
  "organization": {
    "id": "org-uuid",
    "name": "Acme Corp"
  },
  "session": {
    "accessToken": "jwt-token-here",
    "refreshToken": "refresh-token-here",
    "expiresAt": 1234567890
  }
}
```

#### Get Current User
```
GET /api/auth/me
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "admin@acme.com",
    "role": "admin",
    "organizationId": "org-uuid",
    "organization": {
      "id": "org-uuid",
      "name": "Acme Corp"
    }
  }
}
```

## Project Structure
```
backend/
├── src/
│   ├── config/
│   │   └── supabase.js       # Supabase client setup
│   ├── middleware/
│   │   └── auth.js           # JWT verification middleware
│   ├── routes/
│   │   └── auth.js           # Authentication routes
│   ├── services/
│   │   └── authService.js    # Authentication business logic
│   └── server.js             # Express app setup
├── .env                       # Environment variables
└── package.json
```

## Testing with cURL

### Signup
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "organizationName": "Test Org"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get User Profile
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Error Handling

All endpoints return consistent error format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Security Features
- JWT token authentication
- Password hashing (handled by Supabase)
- Row Level Security (RLS) in database
- CORS enabled for frontend
- Organization-based data isolation

## Next Steps
- Frontend integration
- Project management endpoints
- Proxy key generation
- Usage tracking
