#!/bin/bash

# CodeCapsule API Deployment Script
# This script helps deploy the API server to production with serverless execution

set -e

echo "🚀 CodeCapsule API Deployment"
echo "================================"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get user input with default
get_input() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " input
        export $var_name="${input:-$default}"
    else
        read -p "$prompt: " input
        export $var_name="$input"
    fi
}

echo "📋 Deployment Configuration"
echo

# Get deployment configuration
get_input "AWS API Gateway URL (leave empty for local development)" "" "AWS_API_GATEWAY_URL"
get_input "CORS Origin (your frontend domain)" "https://yourdomain.com" "CORS_ORIGIN"
get_input "Environment" "production" "NODE_ENV"

# Create production environment file
echo "📝 Creating production environment configuration..."
cat > .env.production << EOF
# API Production Environment Configuration
PORT=3001

# Azure OpenAI Configuration (Production)
AZURE_OPENAI_API_KEY=\${AZURE_OPENAI_API_KEY}
AZURE_OPENAI_ENDPOINT=\${AZURE_OPENAI_ENDPOINT}
AZURE_OPENAI_API_VERSION=2024-04-01-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# CORS Configuration (Production)
CORS_ORIGIN=$CORS_ORIGIN

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
AWS_API_GATEWAY_URL=$AWS_API_GATEWAY_URL
USE_LOCAL_EXECUTION_FALLBACK=false

# Production Flags
NODE_ENV=$NODE_ENV
EOF

echo "✅ Production environment file created: .env.production"

# Build the application
echo "🔨 Building the application..."
npm run build

# Choose deployment method
echo
echo "🌐 Deployment Options"
echo "1. Docker Container"
echo "2. Node.js Direct"
echo "3. Generate deployment files only"

get_input "Choose deployment method (1-3)" "1" "DEPLOY_METHOD"

case $DEPLOY_METHOD in
    1)
        echo "🐳 Building Docker container..."
        if command_exists docker; then
            docker build -t codecapsule-api .
            echo "✅ Docker image built: codecapsule-api"
            echo
            echo "To run in production:"
            echo "  docker run -p 3001:3001 --env-file .env.production codecapsule-api"
            echo
            echo "To run with docker-compose:"
            echo "  docker-compose --profile production up -d"
        else
            echo "❌ Docker not found. Please install Docker and try again."
            exit 1
        fi
        ;;
    2)
        echo "🟢 Setting up Node.js direct deployment..."
        echo "To run in production:"
        echo "  export \$(cat .env.production | xargs)"
        echo "  npm start"
        ;;
    3)
        echo "📄 Deployment files generated."
        echo "Files created:"
        echo "  - .env.production"
        echo "  - Dockerfile"
        echo "  - docker-compose.yml"
        echo "  - DEPLOYMENT.md"
        ;;
esac

echo
echo "🎉 Deployment preparation complete!"
echo
echo "📚 Next Steps:"
echo "1. Deploy your Terraform infrastructure (if not done already):"
echo "   cd ../terraform && terraform apply"
echo
echo "2. Get your API Gateway URL from Terraform:"
echo "   terraform output api_gateway_url"
echo
echo "3. Update .env.production with the actual API Gateway URL"
echo
echo "4. Deploy using your chosen method above"
echo
echo "5. Test your deployment:"
echo "   curl https://your-api-domain.com/health"
echo
echo "📖 For detailed instructions, see DEPLOYMENT.md"