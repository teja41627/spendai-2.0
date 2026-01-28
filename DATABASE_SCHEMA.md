# SpendOnline 2.0 (SpendAI) - Database Schema

## Overview
PostgreSQL database hosted on Supabase with Row Level Security (RLS) enabled for multi-tenant isolation.

---

## Tables

### 1. `organizations`
Stores organization details. Each organization is isolated via RLS.

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_organizations_created_at ON organizations(created_at);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
```

**Columns:**
- `id`: Primary key (UUID)
- `name`: Organization name (e.g., "Acme Corp")
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

---

### 2. `users`
Extends Supabase `auth.users` with organization and role information.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'developer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

**Columns:**
- `id`: References `auth.users.id` (Supabase Auth)
- `organization_id`: Foreign key to `organizations`
- `email`: User email (must match `auth.users.email`)
- `role`: Either `admin` or `developer`
- `created_at`, `updated_at`: Timestamps

**Roles:**
- `admin`: Can create projects, generate keys, view all org data
- `developer`: Can view projects and usage data (read-only for MVP)

---

### 3. `projects`
Projects represent applications or services using AI APIs.

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_organization_id ON projects(organization_id);
CREATE INDEX idx_projects_created_by ON projects(created_by);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
```

**Columns:**
- `id`: Primary key (UUID)
- `organization_id`: Foreign key to `organizations`
- `name`: Project name (e.g., "ChatBot API")
- `description`: Optional description
- `created_by`: User who created the project
- `created_at`, `updated_at`: Timestamps

---

### 4. `proxy_keys`
API keys used to authenticate proxy requests.

```sql
CREATE TABLE proxy_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key_value VARCHAR(255) NOT NULL UNIQUE, -- The actual API key (hashed in production)
  name VARCHAR(255), -- Optional friendly name
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_proxy_keys_organization_id ON proxy_keys(organization_id);
CREATE INDEX idx_proxy_keys_project_id ON proxy_keys(project_id);
CREATE INDEX idx_proxy_keys_key_value ON proxy_keys(key_value);
CREATE INDEX idx_proxy_keys_is_active ON proxy_keys(is_active);

-- Enable RLS
ALTER TABLE proxy_keys ENABLE ROW LEVEL SECURITY;
```

**Columns:**
- `id`: Primary key (UUID)
- `organization_id`: Foreign key to `organizations`
- `project_id`: Foreign key to `projects`
- `key_value`: The actual proxy API key (UUID or hash)
- `name`: Optional friendly name for the key
- `is_active`: Whether the key is active
- `created_by`: User who created the key
- `created_at`: Creation timestamp
- `revoked_at`: Timestamp when key was revoked (NULL if active)

---

### 5. `usage_logs`
Logs every API request that goes through the proxy.

```sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  proxy_key_id UUID NOT NULL REFERENCES proxy_keys(id) ON DELETE CASCADE,
  
  -- Request details
  model VARCHAR(100) NOT NULL, -- e.g., "gpt-4", "gpt-3.5-turbo"
  provider VARCHAR(50) DEFAULT 'openai', -- For future multi-provider support
  
  -- Token usage
  tokens_prompt INTEGER NOT NULL DEFAULT 0,
  tokens_completion INTEGER NOT NULL DEFAULT 0,
  tokens_total INTEGER GENERATED ALWAYS AS (tokens_prompt + tokens_completion) STORED,
  
  -- Cost calculation
  cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0.00, -- Cost in USD
  
  -- Metadata
  request_id VARCHAR(255), -- OpenAI request ID for debugging
  status VARCHAR(50) DEFAULT 'success', -- 'success' or 'error'
  error_message TEXT, -- Store error if request failed
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes (CRITICAL for performance)
CREATE INDEX idx_usage_logs_organization_id ON usage_logs(organization_id);
CREATE INDEX idx_usage_logs_project_id ON usage_logs(project_id);
CREATE INDEX idx_usage_logs_proxy_key_id ON usage_logs(proxy_key_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at DESC);
CREATE INDEX idx_usage_logs_model ON usage_logs(model);

-- Enable RLS
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
```

**Columns:**
- `id`: Primary key
- `organization_id`, `project_id`, `proxy_key_id`: Foreign keys
- `model`: LLM model used (e.g., `gpt-4`)
- `provider`: API provider (default: `openai`)
- `tokens_prompt`: Input tokens
- `tokens_completion`: Output tokens
- `tokens_total`: Auto-calculated total
- `cost_usd`: Calculated cost in USD
- `request_id`: OpenAI's request ID
- `status`: `success` or `error`
- `error_message`: Error details if failed
- `created_at`: Timestamp of the request

---

## Row Level Security (RLS) Policies

RLS ensures users only access data from their own organization.

### Organizations
```sql
-- Users can only view their own organization
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );
```

### Users
```sql
-- Users can view other users in their organization
CREATE POLICY "Users can view org members"
  ON users FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());
```

### Projects
```sql
-- Users can view projects in their organization
CREATE POLICY "Users can view org projects"
  ON projects FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Admins can create projects
CREATE POLICY "Admins can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update/delete projects
CREATE POLICY "Admins can update projects"
  ON projects FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete projects"
  ON projects FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Proxy Keys
```sql
-- Users can view proxy keys in their organization
CREATE POLICY "Users can view org proxy keys"
  ON proxy_keys FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Admins can create proxy keys
CREATE POLICY "Admins can create proxy keys"
  ON proxy_keys FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can revoke (update) proxy keys
CREATE POLICY "Admins can revoke proxy keys"
  ON proxy_keys FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Usage Logs
```sql
-- Users can view usage logs in their organization
CREATE POLICY "Users can view org usage logs"
  ON usage_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Service role can insert usage logs (backend only)
CREATE POLICY "Service role can insert usage logs"
  ON usage_logs FOR INSERT
  WITH CHECK (true); -- Backend uses service_role key
```

---

## Sample Cost Calculation

OpenAI pricing (as of Jan 2026, example):
- GPT-4: $0.03/1K prompt tokens, $0.06/1K completion tokens
- GPT-3.5-turbo: $0.0015/1K prompt tokens, $0.002/1K completion tokens

**Backend calculates cost on each request:**
```javascript
const pricing = {
  'gpt-4': { prompt: 0.03 / 1000, completion: 0.06 / 1000 },
  'gpt-3.5-turbo': { prompt: 0.0015 / 1000, completion: 0.002 / 1000 }
};

function calculateCost(model, promptTokens, completionTokens) {
  const rates = pricing[model];
  return (promptTokens * rates.prompt) + (completionTokens * rates.completion);
}
```

---

## Database Migration Files

These SQL statements will be run in Supabase SQL Editor in this order:
1. Create tables
2. Create indexes
3. Enable RLS
4. Create RLS policies

---

## Next Steps
1. ✅ Run migrations in Supabase
2. Test RLS policies
3. Set up authentication flow
4. Build backend API
