#!/bin/bash

echo "🚀 Starting MY-first-devops-project App in Development Mode"
echo "================================================"

if [ ! -f .env.development ]; then
    echo "❌ Error: .env.development file not found!"
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running!"
    exit 1
fi

mkdir -p .neon_local

if ! grep -q ".neon_local/" .gitignore 2>/dev/null; then
    echo ".neon_local/" >> .gitignore
    echo "✅ Added .neon_local/ to .gitignore"
fi

echo "📦 Starting development containers..."
docker compose -f docker.compose.dev.yml up -d --build

echo "⏳ Waiting for the database to be ready..."
until docker compose exec neon-local psql -U neon -d neondb -c "SELECT 1" >/dev/null 2>&1; do
    sleep 2
done

echo "📜 Applying latest schema with Drizzle..."
npm run db:migrate

echo ""
echo "🎉 Development environment started!"
echo "   App: http://localhost:5173"
echo "   DB:  postgres://neon:npg@localhost:5432/neondb"
echo ""
docker compose logs -f app
