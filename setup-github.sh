#!/bin/bash

# GitHub Repository Setup Script for CodeCapsule

echo "🚀 CodeCapsule Container Deployment Setup"
echo "========================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📝 Initializing Git repository..."
    git init
    git branch -M main
else
    echo "✅ Git repository already initialized"
fi

# Add all files
echo "📦 Adding files to Git..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit"
else
    echo "💾 Committing changes..."
    git commit -m "Setup container Lambda functions with GitHub Actions deployment"
fi

# Instructions for user
echo ""
echo "🔧 Next Steps:"
echo "1. Create a GitHub repository:"
echo "   - Go to https://github.com/new"
echo "   - Name it 'codecapsule' or similar"
echo "   - Don't initialize with README (we have files already)"
echo ""
echo "2. Connect to your GitHub repository:"
echo "   git remote add origin https://github.com/YOURUSERNAME/YOURREPONAME.git"
echo ""
echo "3. Push to GitHub:"
echo "   git push -u origin main"
echo ""
echo "4. Add AWS secrets to GitHub:"
echo "   - Go to your repo → Settings → Secrets and variables → Actions"
echo "   - Add AWS_ACCESS_KEY_ID"
echo "   - Add AWS_SECRET_ACCESS_KEY"
echo ""
echo "5. Trigger deployment:"
echo "   - Go to Actions tab"
echo "   - Run 'Deploy Container Lambda Functions' workflow"
echo ""
echo "🎯 Your containers will be built on Linux and deployed automatically!"