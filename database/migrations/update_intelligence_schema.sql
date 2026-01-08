-- Migration: Robust Intelligence Support
-- Description: Adds missing columns to insights and dashboards for AI features
-- Date: 2026-01-08

-- Add metadata to insights for source tracking and actionable steps
ALTER TABLE insights ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add is_active to dashboards for automated rotation/updates
ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Ensure dashboards have a title column (code uses title, schema used name)
-- We'll add title but keep name for compatibility if needed.
ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS title TEXT;

-- Migration to sync name -> title for existing records
UPDATE dashboards SET title = name WHERE title IS NULL;

-- Fix insight_type name in code is easier, but if we want 'type' in DB:
-- ALTER TABLE insights RENAME COLUMN insight_type TO type; 
-- (Ignoring rename to avoid breaking existing queries, will fix code instead)

-- Add comment
COMMENT ON COLUMN insights.metadata IS 'Stores actionable_next_step and source_data_ids for business intelligence';
COMMENT ON COLUMN dashboards.is_active IS 'Indicates if this is the current active dashboard for the project';
