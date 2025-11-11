# CodeCapsule Terraform Deployment Script for Windows PowerShell
# Automated deployment of serverless infrastructure to AWS

param(
    [switch]$AutoApprove,
    [switch]$Help
)

# Color functions for output
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to check prerequisites
function Test-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    # Check if terraform is installed
    try {
        $terraformVersion = terraform version -json | ConvertFrom-Json
        Write-Info "Terraform version: $($terraformVersion.terraform_version)"
    }
    catch {
        Write-Error "Terraform is not installed. Please install Terraform >= 1.0"
        exit 1
    }
    
    # Check if AWS CLI is installed and configured
    try {
        $null = Get-Command aws -ErrorAction Stop
    }
    catch {
        Write-Error "AWS CLI is not installed. Please install and configure AWS CLI"
        exit 1
    }
    
    # Check AWS credentials
    try {
        $awsIdentity = aws sts get-caller-identity | ConvertFrom-Json
        $awsRegion = aws configure get region
        Write-Info "AWS Account: $($awsIdentity.Account)"
        Write-Info "AWS Region: $awsRegion"
    }
    catch {
        Write-Error "AWS credentials not configured. Run 'aws configure' first"
        exit 1
    }
    
    # Check if jq is installed (optional)
    try {
        $null = Get-Command jq -ErrorAction Stop
    }
    catch {
        Write-Warning "jq is not installed. Testing commands may not format JSON output"
        Write-Warning "Consider installing jq for better JSON formatting"
    }
    
    Write-Success "Prerequisites check completed"
}

# Function to validate terraform configuration
function Test-TerraformConfig {
    Write-Info "Validating Terraform configuration..."
    
    # Check if terraform.tfvars exists
    if (-not (Test-Path "terraform.tfvars")) {
        Write-Warning "terraform.tfvars not found. Using default values and environment variables"
        Write-Warning "Consider creating terraform.tfvars from terraform.tfvars.example"
    }
    
    # Validate terraform configuration
    $validationResult = terraform validate
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Terraform configuration is valid"
    }
    else {
        Write-Error "Terraform configuration validation failed"
        exit 1
    }
}

# Function to initialize terraform
function Initialize-Terraform {
    Write-Info "Initializing Terraform..."
    terraform init
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Terraform initialized successfully"
    }
    else {
        Write-Error "Terraform initialization failed"
        exit 1
    }
}

# Function to plan deployment
function New-DeploymentPlan {
    Write-Info "Creating Terraform execution plan..."
    terraform plan -out=tfplan
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Terraform plan created successfully"
        Write-Info "Review the plan above before proceeding with deployment"
    }
    else {
        Write-Error "Terraform plan failed"
        exit 1
    }
}

# Function to apply deployment
function Start-Deployment {
    Write-Info "Applying Terraform configuration..."
    terraform apply tfplan
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Deployment completed successfully!"
    }
    else {
        Write-Error "Deployment failed"
        exit 1
    }
}

# Function to test deployment
function Test-Deployment {
    Write-Info "Testing deployed infrastructure..."
    
    # Get API Gateway URL
    try {
        $apiUrl = terraform output -raw api_gateway_url
        Write-Info "API Gateway URL: $apiUrl"
    }
    catch {
        Write-Error "Could not retrieve API Gateway URL"
        return
    }
    
    # Test health check
    Write-Info "Testing health check endpoint..."
    try {
        $healthResponse = Invoke-RestMethod -Uri "$apiUrl/health" -Method Get
        Write-Success "Health check passed"
        $healthResponse | ConvertTo-Json -Depth 10
    }
    catch {
        Write-Error "Health check failed: $_"
    }
    
    # Test Python execution
    Write-Info "Testing Python execution..."
    try {
        $pythonBody = @{
            code = 'print("Hello from CodeCapsule Lambda!")'
        } | ConvertTo-Json
        
        $pythonResponse = Invoke-RestMethod -Uri "$apiUrl/execute/python" -Method Post -Body $pythonBody -ContentType "application/json"
        Write-Success "Python execution test passed"
        $pythonResponse | ConvertTo-Json -Depth 10
    }
    catch {
        Write-Error "Python execution test failed: $_"
    }
    
    # Test JavaScript execution
    Write-Info "Testing JavaScript execution..."
    try {
        $jsBody = @{
            code = 'console.log("Hello from CodeCapsule Lambda!")'
        } | ConvertTo-Json
        
        $jsResponse = Invoke-RestMethod -Uri "$apiUrl/execute/javascript" -Method Post -Body $jsBody -ContentType "application/json"
        Write-Success "JavaScript execution test passed"
        $jsResponse | ConvertTo-Json -Depth 10
    }
    catch {
        Write-Error "JavaScript execution test failed: $_"
    }
}

# Function to display deployment info
function Show-DeploymentInfo {
    Write-Info "Deployment Information:"
    Write-Host ""
    
    # Show all outputs
    terraform output
    
    Write-Host ""
    Write-Info "Quick Test Commands:"
    
    try {
        $apiUrl = terraform output -raw api_gateway_url
        Write-Host ""
        Write-Host "Health Check:" -ForegroundColor Cyan
        Write-Host "  curl $apiUrl/health | jq" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Python Test:" -ForegroundColor Cyan
        Write-Host "  curl -X POST $apiUrl/execute/python -H 'Content-Type: application/json' -d '{`"code`":`"print(2+2)`"}' | jq" -ForegroundColor Gray
        Write-Host ""
        Write-Host "JavaScript Test:" -ForegroundColor Cyan
        Write-Host "  curl -X POST $apiUrl/execute/javascript -H 'Content-Type: application/json' -d '{`"code`":`"console.log(2+2)`"}' | jq" -ForegroundColor Gray
        Write-Host ""
        Write-Host "PowerShell Health Check:" -ForegroundColor Cyan
        Write-Host "  Invoke-RestMethod -Uri '$apiUrl/health' | ConvertTo-Json" -ForegroundColor Gray
    }
    catch {
        Write-Warning "Could not retrieve API URL for test commands"
    }
}

# Main deployment function
function Start-Main {
    Write-Host "=======================================" -ForegroundColor Magenta
    Write-Host "CodeCapsule Serverless Infrastructure" -ForegroundColor Magenta
    Write-Host "Terraform Deployment Script (PowerShell)" -ForegroundColor Magenta
    Write-Host "=======================================" -ForegroundColor Magenta
    Write-Host ""
    
    # Change to terraform directory if not already there
    if (-not (Test-Path "main.tf")) {
        if (Test-Path "terraform") {
            Set-Location terraform
            Write-Info "Changed to terraform directory"
        }
        else {
            Write-Error "Cannot find terraform configuration files"
            exit 1
        }
    }
    
    # Run deployment steps
    Test-Prerequisites
    Write-Host ""
    
    Test-TerraformConfig
    Write-Host ""
    
    Initialize-Terraform
    Write-Host ""
    
    New-DeploymentPlan
    Write-Host ""
    
    # Ask for confirmation before applying
    if ($AutoApprove) {
        Write-Info "Auto-approve enabled, proceeding with deployment..."
    }
    else {
        $confirm = Read-Host "Do you want to proceed with the deployment? (y/N)"
        if ($confirm -notmatch '^[Yy]$') {
            Write-Info "Deployment cancelled by user"
            exit 0
        }
    }
    
    Start-Deployment
    Write-Host ""
    
    Test-Deployment
    Write-Host ""
    
    Show-DeploymentInfo
    
    Write-Success "CodeCapsule serverless infrastructure deployed successfully!"
    Write-Info "Your serverless Judge0 replacement is ready to use!"
}

# Handle help parameter
if ($Help) {
    Write-Host "CodeCapsule Terraform Deployment Script (PowerShell)" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "Usage: .\deploy.ps1 [OPTIONS]" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -AutoApprove    Skip confirmation prompt" -ForegroundColor Gray
    Write-Host "  -Help           Show this help message" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\deploy.ps1                 # Interactive deployment" -ForegroundColor Gray
    Write-Host "  .\deploy.ps1 -AutoApprove    # Automated deployment" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

# Start main function
Start-Main