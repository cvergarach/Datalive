-- Migration: Migrate from Gemini to Claude
-- This migration updates the api_documents table to store text content instead of Gemini URIs

-- 1. Add new columns for Claude-based processing
ALTER TABLE api_documents
ADD COLUMN IF NOT EXISTS text_content TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Make old Gemini columns nullable (we're not using them anymore)
ALTER TABLE api_documents
ALTER COLUMN gemini_uri DROP NOT NULL,
ALTER COLUMN gemini_name DROP NOT NULL;

-- 3. Update existing records to have empty metadata if null
UPDATE api_documents
SET metadata = '{}'::jsonb
WHERE metadata IS NULL;

-- 4. Add comments to document the change
COMMENT ON COLUMN api_documents.text_content IS 'Extracted text content from uploaded document (PDF, etc.)';
COMMENT ON COLUMN api_documents.metadata IS 'Document metadata including number of pages, file info, etc.';
COMMENT ON COLUMN api_documents.gemini_uri IS 'DEPRECATED: Old Gemini file URI, kept for backward compatibility';
COMMENT ON COLUMN api_documents.gemini_name IS 'DEPRECATED: Old Gemini file name, kept for backward compatibility';
