# Deployment Guide

## Prerequisites

- GitHub account
- Supabase account
- Render account
- Vercel account (optional)
- API Keys: Gemini, Claude

## Step 1: Supabase Setup

1. Go to https://supabase.com
2. Create new project
3. Go to SQL Editor
4. Copy and paste `database/schema.sql`
5. Run the SQL
6. Copy Project URL and anon key

## Step 2: Deploy Backend to Render

1. Push code to GitHub
2. Go to https://render.com
3. New → Web Service
4. Connect your repo
5. Settings:
   - Name: `datalive-backend`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Add environment variables from `.env.example`
7. Deploy

## Step 3: Deploy MCP Servers to Render

Repeat for each MCP server:
- `mcp-servers/api-analyzer`
- `mcp-servers/api-executor`
- `mcp-servers/insight-generator`

For each:
1. New Web Service
2. Same repo
3. Root Directory: `mcp-servers/[server-name]`
4. Build: `npm install`
5. Start: `npm start`
6. Add env vars
7. Deploy

## Step 4: Deploy Frontend to Vercel

Option A - CLI:
```bash
cd frontend
npm install -g vercel
vercel --prod
```

Option B - Dashboard:
1. Go to https://vercel.com
2. Import project from GitHub
3. Root Directory: `frontend`
4. Add environment variables
5. Deploy

## Step 5: Update Environment Variables

After all services are deployed, update:
- Backend: Add MCP server URLs
- Frontend: Add backend URL

## Testing

1. Visit frontend URL
2. Create account
3. Create project
4. Upload API doc
5. Configure API
6. Execute and view insights

Done! 🎉
