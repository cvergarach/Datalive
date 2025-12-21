export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: 'admin' | 'user';
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  user_role?: 'owner' | 'admin' | 'editor' | 'viewer';
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  user?: User;
  created_at: string;
}

export interface APIDocument {
  id: string;
  project_id: string;
  title: string;
  file_type: string;
  gemini_uri: string;
  gemini_name: string;
  status: 'processing' | 'analyzed' | 'completed' | 'error';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface DiscoveredAPI {
  id: string;
  project_id: string;
  document_id: string;
  base_url: string;
  name: string;
  description?: string;
  auth_type?: string;
  auth_details?: any;
  discovered_at: string;
  api_endpoints?: APIEndpoint[];
  api_configurations?: APIConfiguration[];
}

export interface APIEndpoint {
  id: string;
  api_id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description?: string;
  parameters?: any;
  response_schema?: any;
  category?: string;
  estimated_value?: 'high' | 'medium' | 'low';
  created_at: string;
}

export interface APIConfiguration {
  id: string;
  api_id: string;
  credentials: any;
  is_active: boolean;
  last_tested?: string;
  test_status?: 'success' | 'failed';
  configured_at: string;
  updated_at: string;
}

export interface APIData {
  id: string;
  project_id: string;
  api_id: string;
  endpoint_id: string;
  data: any;
  record_count?: number;
  executed_at: string;
  execution_duration?: number;
  status: 'success' | 'partial' | 'error';
}

export interface Insight {
  id: string;
  project_id: string;
  insight_type: 'trend' | 'anomaly' | 'correlation' | 'recommendation' | 'summary';
  title: string;
  description: string;
  confidence?: number;
  source_data_ids?: string[];
  created_at: string;
}

export interface Dashboard {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  config: any;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  content: any;
  data_sources?: string[];
  insights_included?: string[];
  created_by: string;
  created_at: string;
}

export interface Chat {
  id: string;
  project_id: string;
  name: string;
  created_by: string;
  created_at: string;
  messages?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  data_references?: string[];
  created_at: string;
}

export interface Integration {
  id: string;
  project_id: string;
  type: 'whatsapp' | 'telegram' | 'instagram' | 'slack' | 'custom';
  config: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
