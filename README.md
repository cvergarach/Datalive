# DataLive - API Documentation to Insights Platform

Enterprise-grade platform for transforming API documentation into actionable business insights using AI.

## Features

- Multi-project architecture with role-based access
- Upload API documentation and AI extracts endpoints automatically
- Configure and execute APIs with your credentials
- Generate AI insights, trends, and recommendations
- Create dashboards and reports
- Integrate WhatsApp, Telegram, Instagram, Slack
- Contextual chat with your data

## Tech Stack

**Frontend**: Next.js 14, TypeScript, TailwindCSS, Google Auth
**Backend**: Node.js, Express, Supabase
**MCP Servers**: API Analyzer, API Executor, Insight Generator
**AI**: Gemini File API, Claude API

## Quick Start

```bash
# 1. Clone
git clone https://github.com/your-username/datalive.git
cd datalive

# 2. Setup Supabase
# - Create project at supabase.com
# - Run database/schema.sql
# - Enable Google Auth

# 3. Install dependencies
./setup.sh

# 4. Configure .env files
# Edit backend/.env
# Edit frontend/.env.local
# Edit mcp-servers/*/.env

# 5. Start services
cd backend && npm run dev
cd mcp-servers/api-analyzer && npm run dev
cd mcp-servers/api-executor && npm run dev
cd mcp-servers/insight-generator && npm run dev
cd frontend && npm run dev
```

## Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md)

**Render**: Backend + 3 MCP servers
**Vercel**: Frontend
**Supabase**: Database

## License

MIT
