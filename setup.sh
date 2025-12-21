#!/bin/bash

echo "🚀 DataLive Setup Script"
echo "========================="
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Setup Backend
echo "📦 Setting up Backend..."
cd backend
npm install
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your credentials"
fi
cd ..

# Setup Frontend
echo "📦 Setting up Frontend..."
cd frontend
npm install
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "⚠️  Please edit frontend/.env.local with your credentials"
fi
cd ..

# Setup MCP Servers
echo "📦 Setting up MCP Servers..."

cd mcp-servers/api-analyzer
npm install
if [ ! -f .env ]; then
    cp .env.example .env
fi
cd ../..

cd mcp-servers/api-executor
npm install
cd ../..

cd mcp-servers/insight-generator
npm install
if [ ! -f .env ]; then
    cp .env.example .env
fi
cd ../..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env files with your credentials"
echo "2. Run database/schema.sql in Supabase"
echo "3. Start services:"
echo "   - cd backend && npm run dev"
echo "   - cd mcp-servers/api-analyzer && npm run dev"
echo "   - cd mcp-servers/api-executor && npm run dev"
echo "   - cd mcp-servers/insight-generator && npm run dev"
echo "   - cd frontend && npm run dev"
echo ""
echo "📖 See QUICKSTART.md for detailed instructions"
