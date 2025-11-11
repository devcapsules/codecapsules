#!/bin/bash

# CodeCapsule Terraform Deployment Script
# Automated deployment of serverless infrastructure to AWS

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if terraform is installed
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform is not installed. Please install Terraform >= 1.0"
        exit 1
    fi
    
    # Check terraform version
    TERRAFORM_VERSION=$(terraform version -json | jq -r '.terraform_version')
    print_status "Terraform version: $TERRAFORM_VERSION"
    
    # Check if AWS CLI is installed and configured
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install and configure AWS CLI"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured. Run 'aws configure' first"
        exit 1
    fi
    
    AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    AWS_REGION=$(aws configure get region)
    print_status "AWS Account: $AWS_ACCOUNT"
    print_status "AWS Region: $AWS_REGION"
    
    # Check if jq is installed (for testing)
    if ! command -v jq &> /dev/null; then
        print_warning "jq is not installed. Testing commands may not work properly"
        print_warning "Install jq for better JSON output formatting"
    fi
    
    print_success "Prerequisites check completed"
}

# Function to validate terraform configuration
validate_config() {
    print_status "Validating Terraform configuration..."
    
    # Check if terraform.tfvars exists
    if [ ! -f "terraform.tfvars" ]; then
        print_warning "terraform.tfvars not found. Using default values and environment variables"
        print_warning "Consider creating terraform.tfvars from terraform.tfvars.example"
    fi
    
    # Validate terraform configuration
    terraform validate
    if [ $? -eq 0 ]; then
        print_success "Terraform configuration is valid"
    else
        print_error "Terraform configuration validation failed"
        exit 1
    fi
}

# Function to initialize terraform
init_terraform() {
    print_status "Initializing Terraform..."
    terraform init
    if [ $? -eq 0 ]; then
        print_success "Terraform initialized successfully"
    else
        print_error "Terraform initialization failed"
        exit 1
    fi
}

# Function to plan deployment
plan_deployment() {
    print_status "Creating Terraform execution plan..."
    terraform plan -out=tfplan
    if [ $? -eq 0 ]; then
        print_success "Terraform plan created successfully"
        print_status "Review the plan above before proceeding with deployment"
    else
        print_error "Terraform plan failed"
        exit 1
    fi
}

# Function to apply deployment
apply_deployment() {
    print_status "Applying Terraform configuration..."
    terraform apply tfplan
    if [ $? -eq 0 ]; then
        print_success "Deployment completed successfully!"
    else
        print_error "Deployment failed"
        exit 1
    fi
}

# Function to test deployment
test_deployment() {
    print_status "Testing deployed infrastructure..."
    
    # Get API Gateway URL
    API_URL=$(terraform output -raw api_gateway_url 2>/dev/null)
    if [ -z "$API_URL" ]; then
        print_error "Could not retrieve API Gateway URL"
        return 1
    fi
    
    print_status "API Gateway URL: $API_URL"
    
    # Test health check
    print_status "Testing health check endpoint..."
    HEALTH_RESPONSE=$(curl -s "$API_URL/health")
    if [ $? -eq 0 ]; then
        print_success "Health check passed"
        if command -v jq &> /dev/null; then
            echo "$HEALTH_RESPONSE" | jq '.'
        else
            echo "$HEALTH_RESPONSE"
        fi
    else
        print_error "Health check failed"
    fi
    
    # Test Python execution
    print_status "Testing Python execution..."
    PYTHON_RESPONSE=$(curl -s -X POST "$API_URL/execute/python" \
        -H 'Content-Type: application/json' \
        -d '{"code":"print(\"Hello from CodeCapsule Lambda!\")"}')
    if [ $? -eq 0 ]; then
        print_success "Python execution test passed"
        if command -v jq &> /dev/null; then
            echo "$PYTHON_RESPONSE" | jq '.'
        else
            echo "$PYTHON_RESPONSE"
        fi
    else
        print_error "Python execution test failed"
    fi
    
    # Test JavaScript execution
    print_status "Testing JavaScript execution..."
    JS_RESPONSE=$(curl -s -X POST "$API_URL/execute/javascript" \
        -H 'Content-Type: application/json' \
        -d '{"code":"console.log(\"Hello from CodeCapsule Lambda!\")"}')
    if [ $? -eq 0 ]; then
        print_success "JavaScript execution test passed"
        if command -v jq &> /dev/null; then
            echo "$JS_RESPONSE" | jq '.'
        else
            echo "$JS_RESPONSE"
        fi
    else
        print_error "JavaScript execution test failed"
    fi
}

# Function to display deployment info
show_deployment_info() {
    print_status "Deployment Information:"
    echo ""
    
    # Show all outputs
    terraform output
    
    echo ""
    print_status "Quick Test Commands:"
    API_URL=$(terraform output -raw api_gateway_url 2>/dev/null)
    if [ ! -z "$API_URL" ]; then
        echo "Health Check:"
        echo "  curl $API_URL/health | jq"
        echo ""
        echo "Python Test:"
        echo "  curl -X POST $API_URL/execute/python -H 'Content-Type: application/json' -d '{\"code\":\"print(2+2)\"}' | jq"
        echo ""
        echo "JavaScript Test:"
        echo "  curl -X POST $API_URL/execute/javascript -H 'Content-Type: application/json' -d '{\"code\":\"console.log(2+2)\"}' | jq"
        echo ""
        echo "Load Test (10 concurrent requests):"
        echo "  for i in {1..10}; do curl -s -X POST $API_URL/execute/python -H 'Content-Type: application/json' -d '{\"code\":\"print('Hello '$i')\"}' & done; wait"
    fi
}

# Main deployment function
main() {
    echo "======================================="
    echo "CodeCapsule Serverless Infrastructure"
    echo "Terraform Deployment Script"
    echo "======================================="
    echo ""
    
    # Change to terraform directory if not already there
    if [ ! -f "main.tf" ]; then
        if [ -d "terraform" ]; then
            cd terraform
            print_status "Changed to terraform directory"
        else
            print_error "Cannot find terraform configuration files"
            exit 1
        fi
    fi
    
    # Run deployment steps
    check_prerequisites
    echo ""
    
    validate_config
    echo ""
    
    init_terraform
    echo ""
    
    plan_deployment
    echo ""
    
    # Ask for confirmation before applying
    if [ "$1" = "--auto-approve" ]; then
        print_status "Auto-approve enabled, proceeding with deployment..."
    else
        echo -n "Do you want to proceed with the deployment? (y/N): "
        read -r CONFIRM
        if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
            print_status "Deployment cancelled by user"
            exit 0
        fi
    fi
    
    apply_deployment
    echo ""
    
    test_deployment
    echo ""
    
    show_deployment_info
    
    print_success "CodeCapsule serverless infrastructure deployed successfully!"
    print_status "Your serverless Judge0 replacement is ready to use!"
}

# Handle script arguments
case "$1" in
    --help|-h)
        echo "CodeCapsule Terraform Deployment Script"
        echo ""
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --auto-approve    Skip confirmation prompt"
        echo "  --help, -h        Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0                 # Interactive deployment"
        echo "  $0 --auto-approve  # Automated deployment"
        echo ""
        exit 0
        ;;
    *)
        main "$1"
        ;;
esac