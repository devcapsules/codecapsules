# CodeCapsule Serverless Infrastructure Deployment

PowerShell deployment script for Windows users.

## Prerequisites

Before deploying, ensure you have:

1. **AWS CLI** installed and configured
   ```powershell
   # Install AWS CLI
   winget install Amazon.AWSCLI
   
   # Configure credentials
   aws configure
   ```

2. **Node.js 18+** installed
   ```powershell
   # Check version
   node --version
   npm --version
   ```

3. **AWS CDK** installed globally
   ```powershell
   npm install -g aws-cdk
   ```

4. **Environment Variables** (optional)
   ```powershell
   # For SQL judge Supabase integration
   $env:SUPABASE_URL = "https://your-project.supabase.co"
   $env:SUPABASE_SERVICE_KEY = "your-service-key"
   $env:DB_HOST = "db.your-project.supabase.co"
   $env:DB_USER = "readonly_user"
   $env:DB_PASSWORD = "secure-password"
   ```

## Quick Deployment

1. **Navigate to infrastructure directory:**
   ```powershell
   cd infrastructure
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Bootstrap CDK (first time only):**
   ```powershell
   cdk bootstrap
   ```

4. **Deploy the stack:**
   ```powershell
   cdk deploy
   ```

## Step-by-Step Deployment

### 1. Install Dependencies
```powershell
cd infrastructure
npm install
```

### 2. Review the Stack
```powershell
# Check what will be created
cdk synth

# See differences from current state
cdk diff
```

### 3. Deploy Infrastructure
```powershell
# Deploy with confirmation prompts
cdk deploy

# Deploy without prompts (CI/CD)
cdk deploy --require-approval never
```

### 4. Verify Deployment
```powershell
# List deployed functions
aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'CodeCapsule')].FunctionName"

# Get API Gateway URL
aws cloudformation describe-stacks --stack-name CodeCapsuleServerlessStack --query "Stacks[0].Outputs[?OutputKey=='APIGatewayURL'].OutputValue" --output text
```

## What Gets Deployed

### Lambda Functions
- **PythonJudge** - Native Python 3.12 runtime
- **JavaScriptJudge** - Node.js 20.x with VM2 sandboxing
- **SQLJudge** - Python with psycopg2 for Supabase
- **JavaJudge** - Container with OpenJDK 17
- **CSharpJudge** - Container with .NET 8
- **GoJudge** - Container with Go 1.21

### API Gateway
- **Production stage** with CORS enabled
- **Rate limiting** (1000 requests/sec, 2000 burst)
- **CloudWatch logging** and metrics
- **Endpoints:**
  - `POST /execute/python`
  - `POST /execute/javascript` 
  - `POST /execute/sql`
  - `POST /execute/java`
  - `POST /execute/csharp`
  - `POST /execute/go`
  - `GET /health`

### ECR Repositories
- **codecapsule/java-judge**
- **codecapsule/csharp-judge**
- **codecapsule/go-judge**

### IAM Roles
- **CodeCapsuleLambdaExecutionRole** with minimal permissions
- **CloudWatch Logs** access
- **X-Ray tracing** permissions

## Testing Deployment

### 1. Health Check
```powershell
$apiUrl = aws cloudformation describe-stacks --stack-name CodeCapsuleServerlessStack --query "Stacks[0].Outputs[?OutputKey=='APIGatewayURL'].OutputValue" --output text
Invoke-RestMethod -Uri "${apiUrl}health"
```

### 2. Test Python Execution
```powershell
$body = @{
    source_code = "print('Hello from AWS Lambda!')"
    input = ""
    time_limit = 10
    memory_limit = 128
} | ConvertTo-Json

Invoke-RestMethod -Uri "${apiUrl}execute/python" -Method POST -Body $body -ContentType "application/json"
```

### 3. Test JavaScript Execution
```powershell
$body = @{
    source_code = "console.log('JavaScript on Lambda!');"
    input = ""
} | ConvertTo-Json

Invoke-RestMethod -Uri "${apiUrl}execute/javascript" -Method POST -Body $body -ContentType "application/json"
```

## Monitoring and Logs

### CloudWatch Logs
```powershell
# View Python judge logs
aws logs tail /aws/lambda/CodeCapsuleServerlessStack-PythonJudge --follow

# View all CodeCapsule logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/CodeCapsule
```

### Metrics
```powershell
# Check function invocations
aws cloudwatch get-metric-statistics --namespace AWS/Lambda --metric-name Invocations --dimensions Name=FunctionName,Value=CodeCapsuleServerlessStack-PythonJudge --start-time 2023-01-01T00:00:00Z --end-time 2023-12-31T23:59:59Z --period 3600 --statistics Sum
```

## Cost Optimization

The serverless architecture provides:
- **$0.00/month** when not used (scales to zero)
- **~$2-5/month** for typical usage
- **No maintenance costs** (AWS managed)
- **Automatic scaling** (0 to 10,000+ concurrent)

## Updating Functions

### Update Function Code
```powershell
# After making changes to lambda functions
cdk deploy

# Update specific function only
aws lambda update-function-code --function-name CodeCapsuleServerlessStack-PythonJudge --zip-file fileb://function.zip
```

### Update Environment Variables
```powershell
# Update SQL judge environment
aws lambda update-function-configuration --function-name CodeCapsuleServerlessStack-SQLJudge --environment Variables='{SUPABASE_URL=https://new-url.supabase.co}'
```

## Cleanup

### Remove All Resources
```powershell
# Destroy the entire stack
cdk destroy

# Confirm deletion
# This will remove all Lambda functions, API Gateway, and ECR repositories
```

### Partial Cleanup
```powershell
# Remove just ECR images to save storage costs
aws ecr list-images --repository-name codecapsule/java-judge --query 'imageIds[?imageTag!=`latest`]' | aws ecr batch-delete-image --repository-name codecapsule/java-judge --image-ids file://
```

## Troubleshooting

### Common Issues

1. **Bootstrap Required**
   ```powershell
   # If you get bootstrap error
   cdk bootstrap aws://ACCOUNT-ID/REGION
   ```

2. **Permission Denied**
   ```powershell
   # Check AWS credentials
   aws sts get-caller-identity
   
   # Ensure proper IAM permissions for CDK
   ```

3. **Container Build Fails**
   ```powershell
   # Check Docker is running
   docker --version
   
   # Manually build container
   docker build -f Dockerfile.java -t java-judge .
   ```

4. **Function Timeout**
   ```powershell
   # Check CloudWatch logs
   aws logs tail /aws/lambda/YourFunctionName --follow
   ```

## Support

For issues and questions:
- Check CloudWatch logs for detailed error messages
- Review CDK documentation: https://docs.aws.amazon.com/cdk/
- AWS Lambda documentation: https://docs.aws.amazon.com/lambda/