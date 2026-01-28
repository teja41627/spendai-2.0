-- Phase 6 Refinement: Add Pricing Snapshot & Currency to Usage Logs
-- Run this in Supabase SQL Editor

-- Add pricing snapshot columns
-- Stores the exact pricing used for cost calculation (audit trail)
ALTER TABLE usage_logs 
ADD COLUMN IF NOT EXISTS price_prompt_per_million DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS price_completion_per_million DECIMAL(10, 2);

-- Add explicit currency field (future-proofs for multi-currency)
ALTER TABLE usage_logs 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';

-- Add comments for documentation
COMMENT ON COLUMN usage_logs.price_prompt_per_million IS 'Price per 1M prompt tokens (USD) at time of request. Enables audit trail.';
COMMENT ON COLUMN usage_logs.price_completion_per_million IS 'Price per 1M completion tokens (USD) at time of request. Enables audit trail.';
COMMENT ON COLUMN usage_logs.currency IS 'Currency code (ISO 4217). Default: USD.';

-- ✅ Migration complete
SELECT 'Phase 6 refinement complete: Pricing snapshot and currency fields added' as status;
