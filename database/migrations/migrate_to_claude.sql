-- Migration: Migrate from Gemini to Claude
-- This migration updates the api_documents table to store text content instead of Gemini URIs

-- 1. Add new columns for Claude-based processing
ALTER TABLE api_documents
ADD COLUMN IF NOT EXISTS text_content TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Drop old Gemini-specific columns (optional, can keep for backward compatibility)
-- Uncomment these lines if you want to completely remove Gemini references
-- ALTER TABLE api_documents DROP COLUMN IF EXISTS gemini_uri;
-- ALTER TABLE api_documents DROP COLUMN IF EXISTS gemini_name;

-- 3. Update existing records to have empty metadata if null
UPDATE api_documents
SET metadata = '{}'::jsonb
WHERE metadata IS NULL;

-- 4. Add comment to document the change
COMMENT ON COLUMN api_documents.text_content IS 'Extracted text content from uploaded document (PDF, etc.)';
COMMENT ON COLUMN api_documents.metadata IS 'Document metadata including number of pages, file info, etc.';
