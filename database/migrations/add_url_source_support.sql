-- Migration: Add URL source support to api_documents (FIXED)
-- Date: 2025-12-23
-- Description: Adds source_type and source_url fields to support URL-based document scanning

-- Add source_type enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_source_type') THEN
    CREATE TYPE document_source_type AS ENUM ('file', 'url');
  END IF;
END $$;

-- Add source_type column (default to 'file' for existing records)
ALTER TABLE api_documents 
ADD COLUMN IF NOT EXISTS source_type document_source_type DEFAULT 'file';

-- Add source_url column for URL-based documents
ALTER TABLE api_documents 
ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Add comments
COMMENT ON COLUMN api_documents.source_type IS 'Type of document source: file upload or URL';
COMMENT ON COLUMN api_documents.source_url IS 'Original URL for URL-based documents';
