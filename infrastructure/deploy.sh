#!/bin/bash

# CodeCapsule Serverless Infrastructure Deployment Script
# This script deploys the complete serverless execution engine to AWS

set -e

echo "🚀 CodeCapsule Serverless Deployment Script"
echo "============================================"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    echo "   Visit: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
    exit 1
fi

# Check if AWS CDK is installed
if ! command -v cdk &> /dev/null; then
    echo "📦 Installing AWS CDK..."
    npm install -g aws-cdk
fi

# Check AWS credentials
echo "🔐 Checking AWS credentials..."
aws sts get-caller-identity > /dev/null 2>&1 || {
    echo "❌ AWS credentials not configured. Please run 'aws configure'"
    exit 1
}

# Get AWS account and region
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
export CDK_DEFAULT_REGION=$(aws configure get region || echo "us-east-1")

echo "   Account: $CDK_DEFAULT_ACCOUNT"
echo "   Region: $CDK_DEFAULT_REGION"

# Navigate to infrastructure directory
cd "$(dirname "$0")"

# Install dependencies
echo "📦 Installing CDK dependencies..."
npm install

# Bootstrap CDK (only if not already done)
echo "🏗️  Bootstrapping CDK..."
cdk bootstrap "aws://$CDK_DEFAULT_ACCOUNT/$CDK_DEFAULT_REGION" || echo "CDK already bootstrapped"

# Build TypeScript
echo "🔨 Building CDK stack..."
npm run build

# Show what will be deployed
echo "📋 Reviewing deployment plan..."
cdk diff

# Ask for confirmation
echo ""
read -p "🤔 Do you want to proceed with deployment? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying CodeCapsule serverless infrastructure..."
    
    # Deploy the stack
    cdk deploy --require-approval never
    
    echo ""
    echo "✅ Deployment completed!"
    echo ""
    echo "🔗 Next steps:"
    echo "   1. Update your API configuration with the new API Gateway URL"
    echo "   2. Test the endpoints using the provided URLs"
    echo "   3. Monitor Lambda functions in AWS Console"
    echo ""
    echo "📊 Useful commands:"
    echo "   - View logs: aws logs tail /aws/lambda/CodeCapsuleServerlessStack-PythonJudge --follow"
    echo "   - Check function status: aws lambda list-functions --query 'Functions[?starts_with(FunctionName, \`CodeCapsule\`)].FunctionName'"
    echo "   - Update function: cdk deploy (after making changes)"
    echo ""
else
    echo "❌ Deployment cancelled"
    exit 0
fi