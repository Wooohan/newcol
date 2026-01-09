#!/bin/bash

# MessengerFlow Real-Time Setup Script
# This script sets up the development environment

set -e

echo "🚀 MessengerFlow Real-Time Setup"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
cd ..
echo "✅ Server dependencies installed"
echo ""

# Install client dependencies
echo "📦 Installing client dependencies..."
npm install
echo "✅ Client dependencies installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f server/.env ]; then
    echo "📝 Creating server/.env file..."
    cp server/.env.example server/.env
    echo "✅ Created server/.env - Please update with your credentials"
    echo ""
    echo "⚠️  IMPORTANT: Edit server/.env with your Supabase credentials before running!"
    echo ""
else
    echo "✅ server/.env already exists"
    echo ""
fi

# Create logs directory
mkdir -p logs
echo "✅ Created logs directory"
echo ""

# Check if Supabase schema is set up
echo "📊 Database Setup"
echo "=================="
echo ""
echo "Please ensure you have run the database schema in Supabase:"
echo "1. Go to https://supabase.com/dashboard"
echo "2. Open SQL Editor"
echo "3. Copy and run the contents of database/schema.sql"
echo ""

# Display next steps
echo "✅ Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo ""
echo "1. Update server/.env with your credentials"
echo "2. Run database/schema.sql in Supabase SQL Editor"
echo "3. Start the development servers:"
echo ""
echo "   Terminal 1 (Server):"
echo "   $ cd server && npm run dev"
echo ""
echo "   Terminal 2 (Client):"
echo "   $ npm run dev"
echo ""
echo "4. Configure Facebook webhook:"
echo "   - URL: http://localhost:3000/webhook"
echo "   - Verify Token: my_secret_123"
echo ""
echo "For production deployment, see DEPLOYMENT_GUIDE.md"
echo ""
echo "Happy coding! 🎉"
