-- Add metadata column to discovered_apis table for auto-execution support
-- This column stores extracted credentials and auto_executable flag

ALTER TABLE discovered_apis
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add index for faster queries on auto_executable flag
CREATE INDEX IF NOT EXISTS idx_discovered_apis_metadata_auto_executable 
ON discovered_apis ((metadata->>'auto_executable'));

-- Add comment
COMMENT ON COLUMN discovered_apis.metadata IS 'Stores extracted credentials, auto_executable flag, and execution plan for automated API execution';
