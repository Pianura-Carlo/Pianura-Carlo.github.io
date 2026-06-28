#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "=================================================="
echo "🚀 PIANURA CARLO - GITHUB PAGES DEPLOYMENT SCRIPT 🚀"
echo "=================================================="

# 1. Clean previous build artifacts
echo "🧹 Cleaning up old build artifacts..."
rm -rf dist

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 3. Build the application for production
echo "🏗️ Building the application..."
npm run build

# 4. Check if we are inside a git repository
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo "❌ Error: Not in a git repository. Please run 'git init' and configure your repository first."
  exit 1
fi

# 5. Fetch remote URL
REMOTE_URL=$(git config --get remote.origin.url)

if [ -z "$REMOTE_URL" ]; then
  echo "⚠️ Warning: No git remote found."
  echo "To push automatically, add your GitHub repository remote first:"
  echo "  git remote add origin https://github.com/USERNAME/REPOSITORY.git"
  echo ""
  echo "If you want to manually upload, the production build is ready in the 'dist' folder!"
  exit 0
fi

# 6. Deploying to the gh-pages branch
echo "📤 Preparing deployment files..."
cd dist

# Create a clean git instance in the dist directory
git init
git checkout -b gh-pages
git add .
git commit -m "Deploy to GitHub Pages [skip ci]"

echo "🔗 Pushing production build to: $REMOTE_URL"
git push -f "$REMOTE_URL" gh-pages

cd ..
echo "=================================================="
echo "✅ SUCCESS: App deployed to the gh-pages branch!"
echo "=================================================="
