# 🚀 Quick Start Guide

## Local Development Setup (5 minutes)

### 1. Clone Repository
```bash
git clone https://github.com/your-username/datalive.git
cd datalive
```

### 2. Setup Supabase
1. Create project at https://supabase.com
2. Run `database/schema.sql` in SQL Editor
3. Copy credentials

### 3. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

Backend runs on http://localhost:3000

### 4. Setup MCP Servers (in separate terminals)

```bash
# Terminal 2
cd mcp-servers/api-analyzer
npm install
cp .env.example .env
npm run dev

# Terminal 3
cd mcp-servers/api-executor
npm install
npm run dev

# Terminal 4
cd mcp-servers/insight-generator
npm install
cp .env.example .env
npm run dev
```

### 5. Setup Frontend
```bash
# Terminal 5
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local
npm run dev
```

Frontend runs on http://localhost:3000

### 6. Test the Application

1. Open http://localhost:3000
2. Create account
3. Create project
4. Upload a PDF API documentation
5. Wait for analysis
6. Configure API with credentials
7. Execute endpoints
8. View insights!

## Production Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for full production setup.

## Troubleshooting

**Port already in use?**
```bash
# Change PORT in .env files
```

**Gemini API errors?**
- Check API key
- Verify file upload permissions

**Database connection errors?**
- Check Supabase credentials
- Verify RLS policies are set

## Need Help?

- 📚 [Full Documentation](docs/ARCHITECTURE.md)
- 🐛 [Open an Issue](https://github.com/your-username/datalive/issues)
- 💬 [Discussions](https://github.com/your-username/datalive/discussions)
