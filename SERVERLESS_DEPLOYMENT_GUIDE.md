# 🚀 CodeCapsule Serverless Execution Engine Deployment Guide

## 📋 Current Status

### ✅ What's Complete:
- **Lambda Functions**: Python, JavaScript, Java, C#, Go, SQL execution engines created
- **Terraform Infrastructure**: Complete AWS infrastructure configuration (330+ lines)
- **API Integration**: ServerlessExecutionEngine class integrated into API server
- **Local Fallback**: WASM-based local execution working for development
- **Deployment Scripts**: PowerShell and Bash deployment scripts ready

### ❌ What's Pending:
- **AWS Deployment**: Lambda functions not deployed to AWS yet
- **Environment Variables**: AWS API Gateway URL not configured
- **Production Switch**: Currently using local fallback instead of AWS Lambda

## 🏗️ Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CodeCapsule   │    │   API Gateway   │    │ Lambda Functions│
│   API Server    │────│   (AWS)        │────│    (AWS)        │
│  (Port 3001)    │    │                │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────│ Local Fallback  │──────────────┘
                        │ (WASM/Docker)    │
                        └─────────────────┘
```

## 🔧 Prerequisites

1. **AWS CLI configured** with appropriate permissions
2. **Terraform >= 1.0** installed
3. **Docker installed** (for container-based languages)
4. **AWS Account** with Lambda and API Gateway permissions

## 📦 Infrastructure Files Ready for Deployment

### Terraform Configuration:
- `terraform/main.tf` (330 lines) - Complete AWS infrastructure
- `terraform/variables.tf` (318 lines) - All configuration variables
- `terraform/api-gateway.tf` - API Gateway configuration
- `terraform/outputs.tf` - Output values including API Gateway URL

### Lambda Functions:
- `packages/runtime/lambda-functions/python-judge.py`
- `packages/runtime/lambda-functions/javascript-judge.js`
- `packages/runtime/lambda-functions/java-judge.py`
- `packages/runtime/lambda-functions/csharp-judge.cs`
- `packages/runtime/lambda-functions/go-judge.go`
- `packages/runtime/lambda-functions/sql-judge.py`

### Deployment Scripts:
- `terraform/deploy.ps1` (300 lines) - Windows PowerShell deployment
- `terraform/deploy.sh` - Linux/macOS deployment

## 🚀 Deployment Steps

### Step 1: Configure Environment Variables
```bash
# Copy and configure terraform variables
cp terraform/terraform.tfvars.example terraform/terraform.tfvars

# Edit terraform.tfvars with your AWS region and preferences
# aws_region = "us-east-1"  # Choose your preferred region
# environment = "dev"       # dev, staging, or prod
```

### Step 2: Deploy Infrastructure
```powershell
# Windows PowerShell
cd terraform
.\deploy.ps1

# Or with auto-approve (skip confirmation)
.\deploy.ps1 -AutoApprove
```

```bash
# Linux/macOS
cd terraform
./deploy.sh

# Or with auto-approve
./deploy.sh --auto-approve
```

### Step 3: Update Environment Variables
After deployment completes, add to your `.env.local`:
```env
# AWS Serverless Execution Engine
AWS_API_GATEWAY_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
USE_LOCAL_EXECUTION_FALLBACK=false

# Optional: AWS credentials (if not using IAM roles)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

### Step 4: Test Production Execution
```bash
# Restart API server to pick up new environment variables
cd apps/api
npm run dev

# Test execution endpoint
curl -X POST http://localhost:3001/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "print(\"Hello from AWS Lambda!\")",
    "language": "python",
    "input": ""
  }'
```

## 💰 Cost Optimization Benefits

### Judge0 vs AWS Lambda Comparison:
| Feature | Judge0 (Current) | AWS Lambda (New) |
|---------|-----------------|------------------|
| **Idle Cost** | $50-200/month | $0 |
| **Per Execution** | ~$0.01 | ~$0.0001 |
| **Scaling** | Manual | Automatic |
| **Security** | Shared containers | Isolated microVMs |
| **Maintenance** | High | Zero |
| **Cold Start** | None | ~100ms |

**Expected Savings**: 90% cost reduction for typical usage patterns

## 🔍 Troubleshooting

### Common Issues:

1. **"AWS credentials not configured"**
   ```bash
   aws configure
   # Enter your AWS Access Key ID, Secret, Region, Output format
   ```

2. **"Terraform not found"**
   ```bash
   # Install Terraform
   # Windows: choco install terraform
   # macOS: brew install terraform
   # Linux: Download from terraform.io
   ```

3. **"Lambda function deployment failed"**
   - Check IAM permissions for Lambda, API Gateway, CloudWatch
   - Verify AWS region supports Lambda (most do)
   - Check if function names are unique in your account

4. **"API Gateway URL not working"**
   - Wait 2-3 minutes after deployment for propagation
   - Check CORS configuration in API Gateway
   - Verify Lambda function permissions

## 📊 Monitoring & Logs

After deployment, you can monitor execution:

1. **CloudWatch Logs**: Each Lambda function has its own log group
2. **X-Ray Tracing**: Enabled for performance monitoring
3. **API Gateway Metrics**: Request counts, latency, errors

## 🔄 Rollback Plan

If issues occur, you can quickly rollback:
```powershell
# Switch back to local execution
# In .env.local:
USE_LOCAL_EXECUTION_FALLBACK=true

# Or destroy AWS infrastructure
cd terraform
terraform destroy
```

## 🎯 Next Steps After Deployment

1. **Performance Testing**: Run load tests to verify scaling
2. **Cost Monitoring**: Set up AWS billing alerts
3. **Security Review**: Configure VPC, security groups if needed
4. **Custom Runtimes**: Add more languages as container images
5. **Edge Optimization**: Consider CloudFront for global distribution

## 📞 Support

If deployment issues occur:
1. Check `terraform/deploy.log` for detailed error messages
2. Verify AWS service limits (Lambda concurrent executions)
3. Test individual Lambda functions in AWS Console
4. Check API Gateway test console for endpoint issues