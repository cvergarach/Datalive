# 📁 DataLive - Project Structure

```
datalive/
│
├── 📄 README.md                      # Main documentation
├── 📄 LICENSE                        # MIT License
├── 📄 QUICKSTART.md                  # Quick start guide
├── 📄 CONTRIBUTING.md                # Contribution guidelines
├── 📄 .gitignore                     # Git ignore rules
├── 🐳 docker-compose.yml             # Docker setup
├── 🔧 setup.sh                       # Automated setup script
│
├── 📂 backend/                       # Backend API (Render)
│   ├── 📄 package.json
│   ├── 📄 .env.example
│   ├── 🐳 Dockerfile
│   └── 📂 src/
│       ├── 📄 server.js             # Express server
│       ├── 📂 config/
│       │   └── 📄 supabase.js       # Supabase client
│       ├── 📂 middleware/
│       │   └── 📄 auth.js           # Auth middleware
│       ├── 📂 services/
│       │   ├── 📄 gemini.js         # Gemini File API
│       │   └── 📄 mcp-client.js     # MCP client
│       └── 📂 routes/
│           ├── 📄 auth.js           # Authentication
│           ├── 📄 projects.js       # Projects CRUD
│           ├── 📄 documents.js      # Doc upload/analysis
│           ├── 📄 apis.js           # API management
│           ├── 📄 data.js           # Data from APIs
│           ├── 📄 insights.js       # AI insights
│           ├── 📄 dashboards.js     # Dashboards
│           ├── 📄 reports.js        # Reports
│           ├── 📄 integrations.js   # WhatsApp/Telegram
│           └── 📄 webhooks.js       # Webhook handlers
│
├── 📂 frontend/                      # Frontend (Vercel/Render)
│   ├── 📄 package.json
│   ├── 📄 .env.example
│   ├── 📄 tsconfig.json
│   ├── 📄 tailwind.config.ts
│   ├── 📄 next.config.mjs
│   ├── 🐳 Dockerfile
│   └── 📂 src/
│       ├── 📂 app/
│       │   ├── 📄 layout.tsx        # Root layout
│       │   ├── 📄 page.tsx          # Landing page
│       │   ├── 📄 globals.css       # Global styles
│       │   ├── 📂 login/
│       │   │   └── 📄 page.tsx      # Login page
│       │   └── 📂 projects/
│       │       └── 📄 page.tsx      # Projects list
│       ├── 📂 components/            # React components
│       └── 📂 lib/
│           ├── 📄 supabase.ts       # Supabase client
│           └── 📄 api.ts            # API client
│
├── 📂 mcp-servers/                   # MCP Servers (Render)
│   │
│   ├── 📂 api-analyzer/             # Analyzes API docs
│   │   ├── 📄 package.json
│   │   ├── 📄 .env.example
│   │   └── 📄 index.js
│   │
│   ├── 📂 api-executor/             # Executes API calls
│   │   ├── 📄 package.json
│   │   └── 📄 index.js
│   │
│   └── 📂 insight-generator/        # Generates insights
│       ├── 📄 package.json
│       ├── 📄 .env.example
│       └── 📄 index.js
│
├── 📂 database/                      # Database schemas
│   └── 📄 schema.sql                # Supabase schema
│
└── 📂 docs/                          # Documentation
    ├── 📄 ARCHITECTURE.md           # Architecture details
    └── 📄 DEPLOYMENT.md             # Deployment guide
```

## 📊 File Count Summary

- **Total Files**: 45+
- **Backend Files**: 15
- **Frontend Files**: 10
- **MCP Servers**: 9
- **Documentation**: 8
- **Configuration**: 8

## 🚀 Technology Stack

### Backend
- Node.js + Express
- Supabase (PostgreSQL)
- Gemini File API
- MCP Protocol

### Frontend
- Next.js 14
- React
- TypeScript
- TailwindCSS

### MCP Servers
- Express
- Gemini AI
- Claude AI
- Axios

## 📦 Deployment Platforms

- **Frontend**: Vercel or Render
- **Backend**: Render
- **MCP Servers**: Render (3 services)
- **Database**: Supabase
- **File Storage**: Gemini File API

## 🔑 Required API Keys

1. Supabase (URL + Anon Key)
2. Gemini API Key
3. Claude API Key

## ⚡ Quick Commands

```bash
# Install all dependencies
./setup.sh

# Start all services (development)
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd mcp-servers/api-analyzer && npm run dev

# Terminal 3
cd mcp-servers/api-executor && npm run dev

# Terminal 4
cd mcp-servers/insight-generator && npm run dev

# Terminal 5
cd frontend && npm run dev

# Docker (alternative)
docker-compose up
```

## 🎯 Next Steps

1. Copy this folder to your GitHub repo
2. Follow QUICKSTART.md
3. Deploy using DEPLOYMENT.md
4. Enjoy! 🎉
