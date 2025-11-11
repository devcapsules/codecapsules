# GitHub Repository Setup Script for CodeCapsule (PowerShell)

Write-Host "🚀 CodeCapsule Container Deployment Setup" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "📝 Initializing Git repository..." -ForegroundColor Yellow
    git init
    git branch -M main
} else {
    Write-Host "✅ Git repository already initialized" -ForegroundColor Green
}

# Add all files
Write-Host "📦 Adding files to Git..." -ForegroundColor Yellow
git add .

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "💾 Committing changes..." -ForegroundColor Yellow
    git commit -m "Setup container Lambda functions with GitHub Actions deployment"
} else {
    Write-Host "ℹ️  No changes to commit" -ForegroundColor Cyan
}

# Instructions for user
Write-Host ""
Write-Host "🔧 Next Steps:" -ForegroundColor Magenta
Write-Host "1. Create a GitHub repository:" -ForegroundColor White
Write-Host "   - Go to https://github.com/new" -ForegroundColor Gray
Write-Host "   - Name it 'codecapsule' or similar" -ForegroundColor Gray
Write-Host "   - Don't initialize with README (we have files already)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Connect to your GitHub repository:" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/YOURUSERNAME/YOURREPONAME.git" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Push to GitHub:" -ForegroundColor White
Write-Host "   git push -u origin main" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Add AWS secrets to GitHub:" -ForegroundColor White
Write-Host "   - Go to your repo → Settings → Secrets and variables → Actions" -ForegroundColor Gray
Write-Host "   - Add AWS_ACCESS_KEY_ID" -ForegroundColor Gray
Write-Host "   - Add AWS_SECRET_ACCESS_KEY" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Trigger deployment:" -ForegroundColor White
Write-Host "   - Go to Actions tab" -ForegroundColor Gray
Write-Host "   - Run 'Deploy Container Lambda Functions' workflow" -ForegroundColor Gray
Write-Host ""
Write-Host "🎯 Your containers will be built on Linux and deployed automatically!" -ForegroundColor Green