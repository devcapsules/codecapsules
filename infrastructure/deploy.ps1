# CodeCapsule Serverless Deployment Script for Windows
# PowerShell script to deploy Lambda functions and API Gateway

param(
    [string]$Stage = "dev",
    [switch]$SkipConfirmation,
    [switch]$DestroyStack
)

Write-Host "🚀 CodeCapsule Serverless Deployment" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Check prerequisites
function Test-Prerequisites {
    Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow
    
    # Check AWS CLI
    if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
        Write-Host "❌ AWS CLI not found. Please install it:" -ForegroundColor Red
        Write-Host "   winget install Amazon.AWSCLI" -ForegroundColor White
        exit 1
    }
    
    # Check Node.js
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Node.js not found. Please install it:" -ForegroundColor Red
        Write-Host "   winget install OpenJS.NodeJS" -ForegroundColor White
        exit 1
    }
    
    # Check CDK
    if (-not (Get-Command cdk -ErrorAction SilentlyContinue)) {
        Write-Host "📦 Installing AWS CDK..." -ForegroundColor Yellow
        npm install -g aws-cdk
    }
    
    # Check AWS credentials
    try {
        aws sts get-caller-identity | Out-Null
        $account = aws sts get-caller-identity --query Account --output text
        $region = aws configure get region
        if (-not $region) { $region = "us-east-1" }
        
        Write-Host "✅ AWS credentials configured" -ForegroundColor Green
        Write-Host "   Account: $account" -ForegroundColor White
        Write-Host "   Region: $region" -ForegroundColor White
        
        $env:CDK_DEFAULT_ACCOUNT = $account
        $env:CDK_DEFAULT_REGION = $region
    }
    catch {
        Write-Host "❌ AWS credentials not configured. Please run:" -ForegroundColor Red
        Write-Host "   aws configure" -ForegroundColor White
        exit 1
    }
}

function Install-Dependencies {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    
    if (Test-Path "package.json") {
        npm install
    } else {
        Write-Host "❌ package.json not found. Are you in the infrastructure directory?" -ForegroundColor Red
        exit 1
    }
}

function Initialize-CDK {
    Write-Host "🏗️  Initializing CDK..." -ForegroundColor Yellow
    
    $env:STAGE = $Stage
    
    # Bootstrap CDK if needed
    $bootstrapResult = cdk bootstrap "aws://$($env:CDK_DEFAULT_ACCOUNT)/$($env:CDK_DEFAULT_REGION)" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ CDK bootstrapped successfully" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  CDK already bootstrapped or bootstrap not needed" -ForegroundColor Blue
    }
}

function Show-DeploymentPlan {
    Write-Host "📋 Reviewing deployment plan..." -ForegroundColor Yellow
    
    # Build TypeScript
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed" -ForegroundColor Red
        exit 1
    }
    
    # Show diff
    Write-Host "Changes to be deployed:" -ForegroundColor Cyan
    cdk diff
}

function Deploy-Stack {
    Write-Host "🚀 Deploying CodeCapsule serverless infrastructure..." -ForegroundColor Yellow
    
    $deployArgs = @("deploy")
    if ($SkipConfirmation) {
        $deployArgs += "--require-approval", "never"
    }
    
    cdk @deployArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
        Show-PostDeploymentInfo
    } else {
        Write-Host "❌ Deployment failed" -ForegroundColor Red
        exit 1
    }
}

function Destroy-Stack {
    Write-Host "🗑️  Destroying CodeCapsule infrastructure..." -ForegroundColor Yellow
    
    if (-not $SkipConfirmation) {
        $confirmation = Read-Host "Are you sure you want to destroy all resources? This cannot be undone. (yes/no)"
        if ($confirmation -ne "yes") {
            Write-Host "❌ Destruction cancelled" -ForegroundColor Red
            exit 0
        }
    }
    
    cdk destroy --force
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Infrastructure destroyed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Destruction failed" -ForegroundColor Red
        exit 1
    }
}

function Show-PostDeploymentInfo {
    Write-Host ""
    Write-Host "🎉 Deployment Information" -ForegroundColor Green
    Write-Host "========================" -ForegroundColor Green
    
    # Get API Gateway URL
    try {
        $apiUrl = aws cloudformation describe-stacks --stack-name CodeCapsuleServerlessStack --query "Stacks[0].Outputs[?OutputKey=='APIGatewayURL'].OutputValue" --output text
        Write-Host "🔗 API Gateway URL: $apiUrl" -ForegroundColor Cyan
        
        # Test health endpoint
        Write-Host "🏥 Testing health endpoint..." -ForegroundColor Yellow
        try {
            $healthResponse = Invoke-RestMethod -Uri "${apiUrl}health" -TimeoutSec 10
            Write-Host "✅ Health check passed: $($healthResponse.status)" -ForegroundColor Green
        }
        catch {
            Write-Host "⚠️  Health check failed (this is normal for new deployments)" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "📚 Available Endpoints:" -ForegroundColor Cyan
        Write-Host "   POST ${apiUrl}execute/python" -ForegroundColor White
        Write-Host "   POST ${apiUrl}execute/javascript" -ForegroundColor White
        Write-Host "   POST ${apiUrl}execute/sql" -ForegroundColor White
        Write-Host "   POST ${apiUrl}execute/java" -ForegroundColor White
        Write-Host "   POST ${apiUrl}execute/csharp" -ForegroundColor White
        Write-Host "   POST ${apiUrl}execute/go" -ForegroundColor White
        Write-Host "   GET  ${apiUrl}health" -ForegroundColor White
        
    }
    catch {
        Write-Host "⚠️  Could not retrieve API Gateway URL" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "🔧 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Update your API configuration:" -ForegroundColor White
    Write-Host "      const executionEngine = new ServerlessExecutionEngine('$apiUrl')" -ForegroundColor Gray
    Write-Host "   2. Test endpoints using the URLs above" -ForegroundColor White
    Write-Host "   3. Monitor functions in AWS Console" -ForegroundColor White
    
    Write-Host ""
    Write-Host "📊 Monitoring Commands:" -ForegroundColor Cyan
    Write-Host "   # View logs:" -ForegroundColor White
    Write-Host "   aws logs tail /aws/lambda/CodeCapsuleServerlessStack-PythonJudge --follow" -ForegroundColor Gray
    Write-Host "   # List functions:" -ForegroundColor White
    Write-Host "   aws lambda list-functions --query 'Functions[?starts_with(FunctionName, ``CodeCapsule``)].FunctionName'" -ForegroundColor Gray
}

function Test-Deployment {
    Write-Host "🧪 Testing deployment..." -ForegroundColor Yellow
    
    try {
        $apiUrl = aws cloudformation describe-stacks --stack-name CodeCapsuleServerlessStack --query "Stacks[0].Outputs[?OutputKey=='APIGatewayURL'].OutputValue" --output text
        
        # Test Python execution
        $pythonTest = @{
            source_code = "print('Hello from deployed Lambda!')"
            input = ""
        } | ConvertTo-Json
        
        Write-Host "Testing Python execution..." -ForegroundColor Yellow
        $result = Invoke-RestMethod -Uri "${apiUrl}execute/python" -Method POST -Body $pythonTest -ContentType "application/json"
        
        if ($result.success) {
            Write-Host "✅ Python execution test passed!" -ForegroundColor Green
            Write-Host "   Output: $($result.stdout)" -ForegroundColor Gray
        } else {
            Write-Host "❌ Python execution test failed" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "⚠️  Could not run deployment test: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Main execution
try {
    Test-Prerequisites
    
    if ($DestroyStack) {
        Destroy-Stack
        exit 0
    }
    
    Install-Dependencies
    Initialize-CDK
    Show-DeploymentPlan
    
    if (-not $SkipConfirmation) {
        Write-Host ""
        $proceed = Read-Host "🤔 Do you want to proceed with deployment? (y/N)"
        if ($proceed -notmatch '^[Yy]') {
            Write-Host "❌ Deployment cancelled" -ForegroundColor Red
            exit 0
        }
    }
    
    Deploy-Stack
    Test-Deployment
    
    Write-Host ""
    Write-Host "🎯 CodeCapsule serverless infrastructure is now live!" -ForegroundColor Green
}
catch {
    Write-Host "💥 Error occurred: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}