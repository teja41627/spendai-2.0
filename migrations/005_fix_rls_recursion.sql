-- Fix for RLS Infinite Recursion
-- This migration replaces recursive policies with security definer functions

-- 1. Create helper functions to break recursion
CREATE OR REPLACE FUNCTION get_auth_org_id() 
RETURNS uuid AS $$
  -- This function runs with the privileges of the creator (SECURITY DEFINER)
  -- and bypasses RLS to get the organization_id of the currently logged-in user.
  SELECT organization_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_auth_role() 
RETURNS varchar AS $$
  -- Bypasses RLS to get the role of the currently logged-in user.
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Update Organizations Policies
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  USING (id = get_auth_org_id());

-- 3. Update Users Policies
DROP POLICY IF EXISTS "Users can view org members" ON users;
CREATE POLICY "Users can view org members"
  ON users FOR SELECT
  USING (organization_id = get_auth_org_id());

-- 4. Update Projects Policies
DROP POLICY IF EXISTS "Users can view org projects" ON projects;
CREATE POLICY "Users can view org projects"
  ON projects FOR SELECT
  USING (organization_id = get_auth_org_id());

DROP POLICY IF EXISTS "Admins can create projects" ON projects;
CREATE POLICY "Admins can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    organization_id = get_auth_org_id() 
    AND get_auth_role() = 'admin'
  );

DROP POLICY IF EXISTS "Admins can update projects" ON projects;
CREATE POLICY "Admins can update projects"
  ON projects FOR UPDATE
  USING (
    organization_id = get_auth_org_id() 
    AND get_auth_role() = 'admin'
  );

DROP POLICY IF EXISTS "Admins can delete projects" ON projects;
CREATE POLICY "Admins can delete projects"
  ON projects FOR DELETE
  USING (
    organization_id = get_auth_org_id() 
    AND get_auth_role() = 'admin'
  );

-- 5. Update Proxy Keys Policies
DROP POLICY IF EXISTS "Users can view org proxy keys" ON proxy_keys;
CREATE POLICY "Users can view org proxy keys"
  ON proxy_keys FOR SELECT
  USING (organization_id = get_auth_org_id());

DROP POLICY IF EXISTS "Admins can create proxy keys" ON proxy_keys;
CREATE POLICY "Admins can create proxy keys"
  ON proxy_keys FOR INSERT
  WITH CHECK (
    organization_id = get_auth_org_id() 
    AND get_auth_role() = 'admin'
  );

DROP POLICY IF EXISTS "Admins can revoke proxy keys" ON proxy_keys;
CREATE POLICY "Admins can revoke proxy keys"
  ON proxy_keys FOR UPDATE
  USING (
    organization_id = get_auth_org_id() 
    AND get_auth_role() = 'admin'
  );

-- 6. Update Usage Logs Policies
DROP POLICY IF EXISTS "Users can view org usage logs" ON usage_logs;
CREATE POLICY "Users can view org usage logs"
  ON usage_logs FOR SELECT
  USING (organization_id = get_auth_org_id());
