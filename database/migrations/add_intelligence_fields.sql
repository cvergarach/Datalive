-- Migration: Add intelligence fields to discovered_apis and api_endpoints
-- Date: 2025-12-23
-- Description: Adds execution_strategy, auth_details to discovered_apis and execution_steps to api_endpoints

-- Add execution_strategy to discovered_apis
ALTER TABLE discovered_apis 
ADD COLUMN IF NOT EXISTS execution_strategy TEXT;

-- Add auth_details to discovered_apis (if not already JSONB)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'discovered_apis' 
    AND column_name = 'auth_details' 
    AND data_type = 'jsonb'
  ) THEN
    ALTER TABLE discovered_apis 
    ALTER COLUMN auth_details TYPE JSONB USING auth_details::jsonb;
  END IF;
END $$;

-- Add execution_steps to api_endpoints
ALTER TABLE api_endpoints 
ADD COLUMN IF NOT EXISTS execution_steps TEXT;

-- Add comments for documentation
COMMENT ON COLUMN discovered_apis.execution_strategy IS 'High-level explanation of how to chain endpoints to generate value';
COMMENT ON COLUMN discovered_apis.auth_details IS 'Detailed authentication information including header names, formats, and setup guide';
COMMENT ON COLUMN api_endpoints.execution_steps IS 'Actionable technical requirements for calling this endpoint';
