# CodeCapsule API Deployment Script (PowerShell)
# This script helps deploy the API server to production with serverless execution

param(
    [string]$AwsApiGatewayUrl = "",
    [string]$CorsOrigin = "https://yourdomain.com",
    [string]$NodeEnv = "production",
    [int]$DeployMethod = 0
)

Write-Host "🚀 CodeCapsule API Deployment" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host

# Function to get user input with default
function Get-UserInput {
    param(
        [string]$Prompt,
        [string]$Default = ""
    )
    
    if ($Default) {
        $input = Read-Host "$Prompt [$Default]"
        if ([string]::IsNullOrEmpty($input)) { return $Default }
        return $input
    } else {
        return Read-Host $Prompt
    }
}

Write-Host "📋 Deployment Configuration" -ForegroundColor Yellow
Write-Host

# Get deployment configuration if not provided
if ([string]::IsNullOrEmpty($AwsApiGatewayUrl)) {
    $AwsApiGatewayUrl = Get-UserInput "AWS API Gateway URL (leave empty for local development)" ""
}

if ($CorsOrigin -eq "https://yourdomain.com") {
    $CorsOrigin = Get-UserInput "CORS Origin (your frontend domain)" "https://yourdomain.com"
}

if ($NodeEnv -eq "production") {
    $NodeEnv = Get-UserInput "Environment" "production"
}

# Create production environment file
Write-Host "📝 Creating production environment configuration..." -ForegroundColor Yellow

$envContent = @"
# API Production Environment Configuration
PORT=3001

# Azure OpenAI Configuration (Production)
AZURE_OPENAI_API_KEY=`${AZURE_OPENAI_API_KEY}
AZURE_OPENAI_ENDPOINT=`${AZURE_OPENAI_ENDPOINT}
AZURE_OPENAI_API_VERSION=2024-04-01-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# CORS Configuration (Production)
CORS_ORIGIN=$CorsOrigin

# Rate Limiting (Production - More restrictive)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50

# Quality Thresholds
DEFAULT_QUALITY_THRESHOLD=75
MINIMUM_QUALITY_SCORE=60

# Runtime Configurations
WASM_MEMORY_LIMIT_MB=64
WASM_EXECUTION_TIMEOUT_MS=5000
DOCKER_MEMORY_LIMIT_MB=2048
DOCKER_EXECUTION_TIMEOUT_MS=30000

# AWS Serverless Execution Configuration (Production)
AWS_API_GATEWAY_URL=$AwsApiGatewayUrl
USE_LOCAL_EXECUTION_FALLBACK=false

# Production Flags
NODE_ENV=$NodeEnv
"@

$envContent | Out-File -FilePath ".env.production" -Encoding UTF8

Write-Host "✅ Production environment file created: .env.production" -ForegroundColor Green

# Build the application
Write-Host "🔨 Building the application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Please check the errors above." -ForegroundColor Red
    exit 1
}

# Choose deployment method if not provided
if ($DeployMethod -eq 0) {
    Write-Host
    Write-Host "🌐 Deployment Options" -ForegroundColor Yellow
    Write-Host "1. Docker Container"
    Write-Host "2. Node.js Direct"
    Write-Host "3. Generate deployment files only"
    Write-Host
    
    do {
        $DeployMethod = Read-Host "Choose deployment method (1-3)"
    } while ($DeployMethod -notmatch '^[1-3]$')
}

switch ($DeployMethod) {
    1 {
        Write-Host "🐳 Building Docker container..." -ForegroundColor Yellow
        
        if (Get-Command docker -ErrorAction SilentlyContinue) {
            docker build -t codecapsule-api .
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Docker image built: codecapsule-api" -ForegroundColor Green
                Write-Host
                Write-Host "To run in production:" -ForegroundColor Cyan
                Write-Host "  docker run -p 3001:3001 --env-file .env.production codecapsule-api" -ForegroundColor White
                Write-Host
                Write-Host "To run with docker-compose:" -ForegroundColor Cyan
                Write-Host "  docker-compose --profile production up -d" -ForegroundColor White
            } else {
                Write-Host "❌ Docker build failed." -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host "❌ Docker not found. Please install Docker and try again." -ForegroundColor Red
            exit 1
        }
    }
    2 {
        Write-Host "🟢 Setting up Node.js direct deployment..." -ForegroundColor Yellow
        Write-Host "To run in production:" -ForegroundColor Cyan
        Write-Host "  # Load environment variables from .env.production" -ForegroundColor White
        Write-Host "  npm start" -ForegroundColor White
    }
    3 {
        Write-Host "📄 Deployment files generated." -ForegroundColor Yellow
        Write-Host "Files created:" -ForegroundColor Cyan
        Write-Host "  - .env.production" -ForegroundColor White
        Write-Host "  - Dockerfile" -ForegroundColor White
        Write-Host "  - docker-compose.yml" -ForegroundColor White
        Write-Host "  - DEPLOYMENT.md" -ForegroundColor White
    }
}

Write-Host
Write-Host "🎉 Deployment preparation complete!" -ForegroundColor Green
Write-Host
Write-Host "📚 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Deploy your Terraform infrastructure (if not done already):" -ForegroundColor White
Write-Host "   cd ..\terraform" -ForegroundColor Cyan
Write-Host "   terraform apply" -ForegroundColor Cyan
Write-Host
Write-Host "2. Get your API Gateway URL from Terraform:" -ForegroundColor White
Write-Host "   terraform output api_gateway_url" -ForegroundColor Cyan
Write-Host
Write-Host "3. Update .env.production with the actual API Gateway URL" -ForegroundColor White
Write-Host
Write-Host "4. Deploy using your chosen method above" -ForegroundColor White
Write-Host
Write-Host "5. Test your deployment:" -ForegroundColor White
Write-Host "   Invoke-RestMethod https://your-api-domain.com/health" -ForegroundColor Cyan
Write-Host
Write-Host "📖 For detailed instructions, see DEPLOYMENT.md" -ForegroundColor Yellow