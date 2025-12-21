# DataLive Deployment Guide

## Prerequisites

- GitHub account
- Supabase account
- Render account
- Vercel account (optional, can use Render)
- Gemini API key
- Claude API key

## Step 1: Supabase Setup

1. Go to https://supabase.com and create new project
2. Navigate to SQL Editor
3. Copy content from `database/schema.sql`
4. Execute the SQL
5. Go to Authentication > Providers
6. Enable Google provider
7. Add authorized redirect URL: `https://your-frontend-url.vercel.app/auth/callback`
8. Copy:
   - Project URL
   - anon/public key
   - service_role key (for backend)

## Step 2: Get API Keys

### Gemini API
1. Go to https://makersuite.google.com/app/apikey
2. Create API key

### Claude API  
1. Go to https://console.anthropic.com
2. Create API key

## Step 3: Deploy Backend to Render

1. Go to https://render.com
2. Connect your GitHub repository
3. Create **Web Service**:
   - **Name**: `datalive-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     SUPABASE_URL=your_supabase_url
     SUPABASE_KEY=your_anon_key
     SUPABASE_SERVICE_KEY=your_service_key
     GEMINI_API_KEY=your_gemini_key
     CLAUDE_API_KEY=your_claude_key
     MCP_API_ANALYZER_URL=https://datalive-api-analyzer.onrender.com
     MCP_API_EXECUTOR_URL=https://datalive-api-executor.onrender.com
     MCP_INSIGHT_GENERATOR_URL=https://datalive-insight-generator.onrender.com
     PORT=3000
     ```
4. Deploy

## Step 4: Deploy MCP Servers to Render

Repeat for each MCP server:

### MCP API Analyzer
- **Name**: `datalive-api-analyzer`
- **Root Directory**: `mcp-servers/api-analyzer`
- **Build**: `npm install`
- **Start**: `npm start`
- **Env Vars**:
  ```
  GEMINI_API_KEY=your_gemini_key
  PORT=3001
  ```

### MCP API Executor
- **Name**: `datalive-api-executor`
- **Root Directory**: `mcp-servers/api-executor`
- **Build**: `npm install`
- **Start**: `npm start`
- **Env Vars**:
  ```
  PORT=3002
  ```

### MCP Insight Generator
- **Name**: `datalive-insight-generator`
- **Root Directory**: `mcp-servers/insight-generator`
- **Build**: `npm install`
- **Start**: `npm start`
- **Env Vars**:
  ```
  CLAUDE_API_KEY=your_claude_key
  PORT=3003
  ```

## Step 5: Update Backend Environment

Go back to `datalive-backend` service in Render and update the MCP URLs with the actual deployed URLs.

## Step 6: Deploy Frontend to Vercel

```bash
cd frontend
npm install -g vercel
vercel login
vercel --prod
```

Or via Vercel Dashboard:
1. Import GitHub repository
2. **Root Directory**: `frontend`
3. **Framework Preset**: Next.js
4. **Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_API_URL=https://datalive-backend.onrender.com
   ```
5. Deploy

## Step 7: Update Supabase Redirect URLs

1. Go to Supabase > Authentication > URL Configuration
2. Add your Vercel URL to:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`

## Step 8: Test the Application

1. Visit your Vercel URL
2. Click "Continue with Google"
3. Authorize the application
4. You should be redirected to the dashboard

## Troubleshooting

**Google Auth not working**
- Check Supabase redirect URLs
- Verify Google OAuth credentials in Supabase

**Backend connection errors**
- Verify all MCP server URLs are correct
- Check Render service logs
- Ensure all environment variables are set

**Database errors**
- Verify Supabase credentials
- Check RLS policies are enabled
- Review SQL schema execution

## Cost Estimate

- **Supabase**: Free tier (up to 500MB database, 2GB file storage)
- **Render**: Free tier for hobby projects, $7/month per service for production
- **Vercel**: Free tier (unlimited deployments)
- **Gemini API**: Free tier available
- **Claude API**: Pay per use

**Total for production**: ~$28/month (4 Render services @ $7 each)

## Next Steps

1. Configure integrations (WhatsApp, Telegram, etc.)
2. Invite team members
3. Upload API documentation
4. Start generating insights

## Support

For issues, check:
- Render logs: https://dashboard.render.com
- Vercel logs: https://vercel.com/dashboard
- Supabase logs: https://supabase.com/dashboard
