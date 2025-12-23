-- DataLive Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROJECTS & USERS
-- =====================================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- =====================================================
-- API DOCUMENTATION
-- =====================================================

CREATE TABLE api_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_type TEXT NOT NULL,
  
  -- Gemini File API data
  gemini_uri TEXT NOT NULL,
  gemini_name TEXT NOT NULL,
  
  -- Processing status
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'analyzed', 'completed', 'error')),
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- DISCOVERED APIs
-- =====================================================

CREATE TABLE discovered_apis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  document_id UUID REFERENCES api_documents(id) ON DELETE CASCADE,
  
  base_url TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Authentication intelligence
  auth_type TEXT, -- bearer, api_key, oauth, basic, none
  auth_details JSONB, -- {header_name, format, guide}
  
  -- Actionable intelligence
  execution_strategy TEXT,
  
  discovered_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE api_endpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_id UUID REFERENCES discovered_apis(id) ON DELETE CASCADE,
  
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  path TEXT NOT NULL,
  description TEXT,
  
  -- Parameters and schemas
  parameters JSONB, -- [{name, type, required, description}]
  response_schema JSONB,
  
  -- Categorization & Execution
  category TEXT, -- data_fetch, mutation, analytics, etc.
  estimated_value TEXT, -- high, medium, low
  execution_steps TEXT, -- Actionable steps for this specific endpoint
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- API CONFIGURATIONS (User credentials)
-- =====================================================

CREATE TABLE api_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_id UUID REFERENCES discovered_apis(id) ON DELETE CASCADE UNIQUE,
  
  -- Encrypted credentials (use Supabase Vault in production)
  credentials JSONB NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_tested TIMESTAMP,
  test_status TEXT CHECK (test_status IN ('success', 'failed')),
  
  configured_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- API DATA (Extracted from APIs)
-- =====================================================

CREATE TABLE api_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  api_id UUID REFERENCES discovered_apis(id) ON DELETE CASCADE,
  endpoint_id UUID REFERENCES api_endpoints(id) ON DELETE CASCADE,
  
  -- Data
  data JSONB NOT NULL,
  record_count INTEGER,
  
  -- Execution metadata
  executed_at TIMESTAMP DEFAULT NOW(),
  execution_duration INTEGER, -- milliseconds
  status TEXT CHECK (status IN ('success', 'partial', 'error'))
);

-- =====================================================
-- INSIGHTS (AI Generated)
-- =====================================================

CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  insight_type TEXT NOT NULL CHECK (insight_type IN ('trend', 'anomaly', 'correlation', 'recommendation', 'summary')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  
  -- Source data references
  source_data_ids UUID[],
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- DASHBOARDS
-- =====================================================

CREATE TABLE dashboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Dashboard configuration
  config JSONB NOT NULL,
  -- Example: [{ type: "line_chart", data_source_id: "...", x: "date", y: "value" }]
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- REPORTS
-- =====================================================

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Report content
  content JSONB NOT NULL,
  
  -- References
  data_sources UUID[], -- api_data ids
  insights_included UUID[], -- insight ids
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- CHATS (Conversations within project)
-- =====================================================

CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  
  -- References to data used in response
  data_references UUID[],
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INTEGRATIONS (WhatsApp, Telegram, etc.)
-- =====================================================

CREATE TABLE project_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN ('whatsapp', 'telegram', 'instagram', 'slack', 'custom')),
  
  -- Integration configuration
  config JSONB NOT NULL,
  -- Example WhatsApp: {phone: "+56912345678", token: "...", webhook_verify: "..."}
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(project_id, type)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_api_documents_project ON api_documents(project_id);
CREATE INDEX idx_discovered_apis_project ON discovered_apis(project_id);
CREATE INDEX idx_api_endpoints_api ON api_endpoints(api_id);
CREATE INDEX idx_api_data_project ON api_data(project_id);
CREATE INDEX idx_insights_project ON insights(project_id);
CREATE INDEX idx_chats_project ON chats(project_id);
CREATE INDEX idx_chat_messages_chat ON chat_messages(chat_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovered_apis ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_integrations ENABLE ROW LEVEL SECURITY;

-- Projects: Users can see projects they're members of
CREATE POLICY "Users can view their projects" ON projects
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM project_members WHERE project_id = projects.id
    )
  );

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update projects" ON projects
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete projects" ON projects
  FOR DELETE USING (auth.uid() = owner_id);

-- Project Members: Users can see members of their projects
CREATE POLICY "Users can view project members" ON project_members
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM project_members pm WHERE pm.project_id = project_members.project_id
    )
  );

-- API Documents: Users can view docs in their projects
CREATE POLICY "Users can view project documents" ON api_documents
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM project_members WHERE project_id = api_documents.project_id
    )
  );

-- Discovered APIs: Users can view APIs in their projects
CREATE POLICY "Users can view project apis" ON discovered_apis
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM project_members WHERE project_id = discovered_apis.project_id
    )
  );

-- API Endpoints: Inherit from discovered_apis
CREATE POLICY "Users can view api endpoints" ON api_endpoints
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM discovered_apis da
      JOIN project_members pm ON da.project_id = pm.project_id
      WHERE da.id = api_endpoints.api_id AND pm.user_id = auth.uid()
    )
  );

-- Similar policies for other tables...
-- (Add more policies as needed)

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_documents_updated_at BEFORE UPDATE ON api_documents
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboards_updated_at BEFORE UPDATE ON dashboards
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA (Optional)
-- =====================================================

-- You can add sample data here if needed for testing
