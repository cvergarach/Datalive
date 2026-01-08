-- Migration: Add settings column to projects table
-- Description: Adds a JSONB column to store project-specific AI model settings and other configurations.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
  "ai_model": "gemini-2.5-flash",
  "language": "es",
  "tone": "commercial"
}'::jsonb;

-- Comment on column for clarity
COMMENT ON COLUMN projects.settings IS 'Project-specific configurations including AI model and language preferences';
