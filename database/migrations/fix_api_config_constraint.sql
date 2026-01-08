-- Migration: Fix API configuration test status constraint
-- This migration allows 'pending' as a valid status in api_configurations

-- 1. Drop the existing constraint
ALTER TABLE api_configurations 
DROP CONSTRAINT IF EXISTS api_configurations_test_status_check;

-- 2. Add the updated constraint including 'pending'
ALTER TABLE api_configurations 
ADD CONSTRAINT api_configurations_test_status_check 
CHECK (test_status IN ('success', 'failed', 'pending'));

-- 3. Set existing configurations to success if they were valid
UPDATE api_configurations SET test_status = 'success' WHERE test_status IS NULL;
