-- Phase 8 Migration: Budgets and Spend Alerts
-- Run this in Supabase SQL Editor

-- 1. Add budget columns to organizations and projects
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS monthly_budget_usd DECIMAL(12, 2) DEFAULT NULL;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS monthly_budget_usd DECIMAL(12, 2) DEFAULT NULL;

-- 2. Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Alert content
  alert_level VARCHAR(20) NOT NULL, -- 'organization' or 'project'
  threshold_percent INTEGER NOT NULL, -- 50, 75, 90, 100
  budget_amount DECIMAL(12, 2) NOT NULL,
  actual_spend DECIMAL(12, 2) NOT NULL,
  
  -- Period tracking (e.g., '2026-01')
  -- Ensures we only trigger once per threshold per month
  month_year VARCHAR(7) NOT NULL, 
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add unique constraint to prevent duplicate alerts for the same threshold in a month
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_org_alert_per_month 
ON alerts (organization_id, threshold_percent, month_year) 
WHERE project_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_project_alert_per_month 
ON alerts (project_id, threshold_percent, month_year) 
WHERE project_id IS NOT NULL;

-- 4. Add indexes for faster lookup
CREATE INDEX IF NOT EXISTS idx_alerts_organization_id ON alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_alerts_project_id ON alerts(project_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);

-- 5. Add comments
COMMENT ON COLUMN organizations.monthly_budget_usd IS 'Monthly spend limit in USD for the entire organization.';
COMMENT ON COLUMN projects.monthly_budget_usd IS 'Optional monthly spend limit in USD for a specific project.';
COMMENT ON TABLE alerts IS 'Triggered spend alerts when budgets cross specific thresholds.';

-- ✅ Migration complete
SELECT 'Phase 8 migration complete: Budgets and Alerts schema added' as status;
