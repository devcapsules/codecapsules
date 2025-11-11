# Production Health Check Script
# This script tests the deployed API to ensure it's working correctly

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiUrl
)

Write-Host "🔍 CodeCapsule API Health Check" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host "Testing API at: $ApiUrl" -ForegroundColor Yellow
Write-Host

# Initialize variables
$health = $null
$result = $null
$genResult = $null

# Test health endpoint
Write-Host "📡 Testing health endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$ApiUrl/health" -Method GET
    Write-Host "✅ Health check passed" -ForegroundColor Green
    
    Write-Host "📊 API Status:" -ForegroundColor Cyan
    Write-Host "   Status: $($health.status)" -ForegroundColor White
    Write-Host "   AI Service: $($health.ai_service)" -ForegroundColor White
    Write-Host "   Execution Mode: $($health.execution_mode)" -ForegroundColor White
    Write-Host "   AWS Gateway: $($health.aws_gateway)" -ForegroundColor White
    Write-Host "   Languages: $($health.supported_languages.Length)" -ForegroundColor White
    Write-Host
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test code execution
Write-Host "🔧 Testing code execution..." -ForegroundColor Yellow
$testCode = @{
    source_code = "print('Hello from production!')"
    language = "python"
}

try {
    $result = Invoke-RestMethod -Uri "$ApiUrl/api/execute" -Method POST -Body ($testCode | ConvertTo-Json) -ContentType "application/json"
    
    if ($result.success) {
        Write-Host "✅ Code execution test passed" -ForegroundColor Green
        Write-Host "   Output: $($result.stdout.Trim())" -ForegroundColor White
        Write-Host "   Execution Time: $($result.execution_time)s" -ForegroundColor White
    } else {
        Write-Host "❌ Code execution failed: $($result.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Code execution test failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test AI generation (if configured)
Write-Host "🤖 Testing AI generation..." -ForegroundColor Yellow
$genTest = @{
    prompt = "Create a simple hello world function"
    language = "python"
}

try {
    $genResult = Invoke-RestMethod -Uri "$ApiUrl/api/generate" -Method POST -Body ($genTest | ConvertTo-Json) -ContentType "application/json"
    
    if ($genResult.success) {
        Write-Host "✅ AI generation test passed" -ForegroundColor Green
        Write-Host "   Generated code preview: $($genResult.code.Substring(0, [Math]::Min(50, $genResult.code.Length)))..." -ForegroundColor White
    } else {
        Write-Host "⚠️  AI generation test failed (may be expected if using mock service)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  AI generation test failed (may be expected if using mock service)" -ForegroundColor Yellow
}

Write-Host
Write-Host "🎉 API deployment verification complete!" -ForegroundColor Green

# Check execution mode
if ($health.execution_mode -eq "serverless") {
    Write-Host "🚀 Serverless execution is active - Using AWS Lambda functions" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Local execution mode detected - Consider setting AWS_API_GATEWAY_URL for production" -ForegroundColor Yellow
}

Write-Host
Write-Host "📈 Performance Summary:" -ForegroundColor Cyan
Write-Host "   Health Check: ✅ Working" -ForegroundColor Green
Write-Host "   Code Execution: ✅ Working" -ForegroundColor Green
if ($genResult -and $genResult.success) {
    Write-Host "   AI Generation: ✅ Working" -ForegroundColor Green
} else {
    Write-Host "   AI Generation: ⚠️  Not configured" -ForegroundColor Yellow
}
Write-Host "   Execution Mode: $($health.execution_mode)" -ForegroundColor White