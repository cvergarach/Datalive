# DataLive Architecture

## Overview

DataLive transforms API documentation into actionable insights using AI.

## System Components

### 1. Frontend (Next.js)
- User interface for project management
- Document upload interface
- Dashboard visualization
- Chat interface

### 2. Backend (Express/Node.js)
- REST API
- Authentication & authorization
- File upload handling
- MCP client orchestration

### 3. MCP Servers
- **API Analyzer**: Extracts endpoints from docs
- **API Executor**: Makes API calls
- **Insight Generator**: Generates AI insights
- **Integrations**: WhatsApp, Telegram, etc.

### 4. Databases & Storage
- **Supabase**: PostgreSQL database
- **Gemini File API**: Document storage & analysis
- **Claude API**: Insight generation

## Data Flow

1. User uploads API documentation
2. Document stored in Gemini File API
3. MCP Analyzer extracts endpoints
4. User configures API credentials
5. MCP Executor fetches data
6. MCP Insight Generator analyzes data
7. Results shown in dashboards

## Security

- Row Level Security (RLS) in Supabase
- JWT authentication
- Encrypted credentials storage
- Rate limiting

## Deployment

- Frontend: Vercel
- Backend: Render
- MCP Servers: Render
- Database: Supabase
