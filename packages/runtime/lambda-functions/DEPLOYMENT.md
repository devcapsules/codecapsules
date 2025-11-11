# 🎯 Serverless Lambda Judge Deployment Guide

Complete infrastructure setup for the CodeCapsule serverless execution engine.

## 📋 Prerequisites

- AWS CLI configured with appropriate permissions
- Docker installed for container image builds
- Node.js 18+ for CDK deployment
- Supabase account for SQL execution

## 🏗️ Infrastructure Setup

### 1. Install AWS CDK

```bash
npm install -g aws-cdk-lib @aws-cdk/aws-lambda
cdk --version
```

### 2. Initialize CDK Project

```bash
mkdir codecapsule-infrastructure
cd codecapsule-infrastructure
cdk init --language typescript
```

### 3. Install Dependencies

```bash
npm install @aws-cdk/aws-lambda @aws-cdk/aws-apigateway @aws-cdk/aws-logs
```

### 4. Deploy Lambda Stack

```bash
# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy all Lambda functions
cdk deploy CodeCapsuleLambdaStack

# Get API Gateway URL
aws cloudformation describe-stacks --stack-name CodeCapsuleLambdaStack --query 'Stacks[0].Outputs'
```

## 🚀 Function-Specific Deployment

### Python Judge (Native Runtime)
```bash
# Deploy Python function
cd lambda-functions
zip python-judge.zip python-judge.py

aws lambda update-function-code \
  --function-name PythonJudge \
  --zip-file fileb://python-judge.zip
```

### JavaScript Judge (Native Runtime)
```bash
# Install dependencies and package
npm install vm2
zip -r javascript-judge.zip javascript-judge.js node_modules/

aws lambda update-function-code \
  --function-name JavaScriptJudge \
  --zip-file fileb://javascript-judge.zip
```

### SQL Judge (Native Runtime)
```bash
# Install psycopg2 layer
pip install psycopg2-binary -t ./python/
zip -r psycopg2-layer.zip python/

# Create and deploy layer
aws lambda publish-layer-version \
  --layer-name psycopg2 \
  --zip-file fileb://psycopg2-layer.zip \
  --compatible-runtimes python3.12

# Deploy SQL judge
zip sql-judge.zip sql-judge.py
aws lambda update-function-code \
  --function-name SQLJudge \
  --zip-file fileb://sql-judge.zip
```

### Container-Based Judges (Java, C#, Go)

```bash
# Build and push Java judge
cd lambda-functions/java
docker build -t java-judge .
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker tag java-judge:latest <account>.dkr.ecr.us-east-1.amazonaws.com/java-judge:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/java-judge:latest

# Update Lambda function
aws lambda update-function-code \
  --function-name JavaJudge \
  --image-uri <account>.dkr.ecr.us-east-1.amazonaws.com/java-judge:latest
```

## 🔧 Environment Configuration

### Set Supabase Connection
```bash
# Configure SQL judge environment
aws lambda update-function-configuration \
  --function-name SQLJudge \
  --environment Variables='{
    "SUPABASE_URL": "https://your-project.supabase.co",
    "SUPABASE_SERVICE_KEY": "your-service-key",
    "DB_HOST": "db.your-project.supabase.co",
    "DB_NAME": "postgres",
    "DB_USER": "readonly_user",
    "DB_PASSWORD": "secure-password"
  }'
```

### Set Security Policies
```bash
# Create IAM role for execution
aws iam create-role \
  --role-name CodeCapsuleExecutionRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {"Service": "lambda.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }
    ]
  }'

# Attach basic execution policy
aws iam attach-role-policy \
  --role-name CodeCapsuleExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

## 📊 Monitoring Setup

### CloudWatch Dashboards
```bash
# Create monitoring dashboard
aws cloudwatch put-dashboard \
  --dashboard-name CodeCapsuleExecution \
  --dashboard-body file://monitoring-dashboard.json
```

### Log Groups
```bash
# Create log groups for each function
aws logs create-log-group --log-group-name /aws/lambda/PythonJudge
aws logs create-log-group --log-group-name /aws/lambda/JavaScriptJudge
aws logs create-log-group --log-group-name /aws/lambda/SQLJudge
aws logs create-log-group --log-group-name /aws/lambda/JavaJudge
aws logs create-log-group --log-group-name /aws/lambda/CSharpJudge
aws logs create-log-group --log-group-name /aws/lambda/GoJudge
```

## 🧪 Testing Deployment

### Function Testing
```bash
# Test Python judge
aws lambda invoke \
  --function-name PythonJudge \
  --payload '{"body": "{\"source_code\": \"print(\\\"Hello World\\\")\", \"input\": \"\"}"}' \
  response.json

# View response
cat response.json
```

### API Gateway Testing
```bash
# Test via API Gateway
curl -X POST https://your-api-id.execute-api.region.amazonaws.com/prod/execute/python \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "print(\"Hello from API Gateway!\")",
    "input": ""
  }'
```

## 💰 Cost Optimization

### Reserved Concurrency
```bash
# Set reserved concurrency to control costs
aws lambda put-reserved-concurrency-configuration \
  --function-name PythonJudge \
  --reserved-concurrent-executions 10
```

### Provisioned Concurrency (Optional)
```bash
# For high-traffic scenarios (usually not needed)
aws lambda put-provisioned-concurrency-config \
  --function-name PythonJudge \
  --qualifier '$LATEST' \
  --provisioned-concurrency-executions 2
```

## 🔄 Updates and Maintenance

### Automated Deployment
```bash
# Create deployment script
cat > deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "Building Lambda functions..."

# Package Python judges
cd lambda-functions
zip python-judge.zip python-judge.py
zip sql-judge.zip sql-judge.py

# Package JavaScript judge with dependencies
npm install vm2
zip -r javascript-judge.zip javascript-judge.js node_modules/

# Update functions
aws lambda update-function-code --function-name PythonJudge --zip-file fileb://python-judge.zip
aws lambda update-function-code --function-name SQLJudge --zip-file fileb://sql-judge.zip
aws lambda update-function-code --function-name JavaScriptJudge --zip-file fileb://javascript-judge.zip

# Build and push container images
for lang in java csharp go; do
  echo "Building ${lang} judge..."
  cd ${lang}
  docker build -t ${lang}-judge .
  
  # Push to ECR (replace with your registry)
  docker tag ${lang}-judge:latest <account>.dkr.ecr.region.amazonaws.com/${lang}-judge:latest
  docker push <account>.dkr.ecr.region.amazonaws.com/${lang}-judge:latest
  
  # Update Lambda
  aws lambda update-function-code \
    --function-name ${lang^}Judge \
    --image-uri <account>.dkr.ecr.region.amazonaws.com/${lang}-judge:latest
  
  cd ..
done

echo "Deployment complete!"
EOF

chmod +x deploy.sh
```

## 📈 Scaling Configuration

The serverless architecture automatically handles scaling, but you can configure limits:

- **Memory**: 128MB - 10GB per function
- **Timeout**: 1 second - 15 minutes  
- **Concurrency**: 1 - 10,000 concurrent executions
- **Storage**: Up to 10GB temporary disk space

For CodeCapsule's use case, recommended settings:
- **Memory**: 512MB (sufficient for most code compilation)
- **Timeout**: 30 seconds (covers complex algorithms)
- **Concurrency**: 100 (handles traffic spikes)

This gives you unlimited scaling capability while maintaining cost efficiency! 🚀