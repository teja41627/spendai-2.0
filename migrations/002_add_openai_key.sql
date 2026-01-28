-- Phase 5 Migration: Add OpenAI API Key Storage
-- Run this in Supabase SQL Editor after Phase 4 migration

-- Add openai_api_key column to organizations table
-- This stores the organization's real OpenAI API key
-- Used by proxy to forward requests to OpenAI
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS openai_api_key TEXT;

-- Add comment for documentation
COMMENT ON COLUMN organizations.openai_api_key IS 'Organization OpenAI API key used for proxy forwarding. Encrypted at rest by Supabase.';

-- ✅ Migration complete
SELECT 'Phase 5 migration complete: OpenAI API key storage added' as status;
