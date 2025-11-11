# API Server Deployment Guide

This guide explains how to deploy the CodeCapsule API server with serverless code execution.

## Architecture Overview

The API server uses a revolutionary serverless execution architecture:
- **Development**: Code runs locally using Node.js child processes
- **Production**: Code executes via AWS Lambda functions (90% cost savings vs Judge0)

## Environment Configuration

### Development (Local)
```bash
# .env
AWS_API_GATEWAY_URL=
USE_LOCAL_EXECUTION_FALLBACK=true
```

### Production (Deployed)
```bash
# .env.production
AWS_API_GATEWAY_URL=https://your-api-id.execute-api.region.amazonaws.com/prod
USE_LOCAL_EXECUTION_FALLBACK=false
NODE_ENV=production
```

## Deployment Steps

### 1. Deploy Serverless Infrastructure
```bash
cd terraform/
terraform init
terraform plan
terraform apply
```

### 2. Get API Gateway URL
After Terraform deployment, get the API Gateway URL:
```bash
terraform output api_gateway_url
```

### 3. Configure Production Environment
Set the AWS_API_GATEWAY_URL in your production environment:
```bash
# For Container/Docker deployment
AWS_API_GATEWAY_URL=https://your-api-id.execute-api.region.amazonaws.com/prod

# For Serverless deployment (AWS Lambda)
export AWS_API_GATEWAY_URL=https://your-api-id.execute-api.region.amazonaws.com/prod
```

### 4. Deploy API Server
Choose your deployment method:

#### Option A: Container Deployment
```bash
# Build container
docker build -t codecapsule-api .
docker run -p 3001:3001 --env-file .env.production codecapsule-api
```

#### Option B: Serverless Deployment
```bash
# Deploy to AWS Lambda, Vercel, or similar
# Use .env.production for environment variables
```

## Testing Production Configuration

### Health Check
```bash
curl https://your-api-domain.com/health
```

Expected response:
```json
{
  "status": "ok",
  "execution_mode": "serverless",
  "aws_gateway": "https://your-api-id.execute-api.region.amazonaws.com/prod",
  "supported_languages": ["python", "javascript", "java", "csharp", "go", "sql"]
}
```

### Test Code Execution
```bash
curl -X POST https://your-api-domain.com/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "print(\"Hello from Lambda!\")",
    "language": "python"
  }'
```

## Environment Variables Reference

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `AWS_API_GATEWAY_URL` | Empty/localhost | API Gateway URL | Serverless execution endpoint |
| `USE_LOCAL_EXECUTION_FALLBACK` | `true` | `false` | Enable local fallback |
| `AZURE_OPENAI_API_KEY` | Your key | Your key | AI generation service |
| `CORS_ORIGIN` | `http://localhost:3000` | Your domain | Frontend origin |
| `NODE_ENV` | `development` | `production` | Environment mode |

## Supported Languages

The serverless execution engine supports:
- **Python**: Native Lambda runtime (fast startup)
- **JavaScript**: Native Lambda runtime (fast startup)  
- **SQL**: Native Lambda runtime with SQLite
- **Java**: Container Lambda runtime (slower startup)
- **C#**: Container Lambda runtime (slower startup)
- **Go**: Container Lambda runtime (slower startup)

## Cost Optimization

### Lambda Configuration
- **Python/JS/SQL**: 256MB RAM, 30s timeout
- **Java/C#/Go**: 1024MB RAM, 60s timeout

### Expected Costs (vs Judge0)
- **Judge0**: ~$50-100/month for containers + maintenance
- **Serverless**: ~$5-10/month for actual usage only
- **Savings**: 90%+ cost reduction

## Troubleshooting

### Common Issues

1. **"No execution method available"**
   - Check `AWS_API_GATEWAY_URL` is set correctly
   - Ensure Lambda functions are deployed

2. **Lambda timeout errors**
   - Increase timeout in terraform configuration
   - Optimize code execution time

3. **CORS errors**
   - Update `CORS_ORIGIN` in production config
   - Check API Gateway CORS settings

### Logs and Monitoring

Check CloudWatch logs for Lambda function execution:
```bash
aws logs tail /aws/lambda/PythonJudge --follow
```

## Security Considerations

1. **Disable Local Fallback**: Set `USE_LOCAL_EXECUTION_FALLBACK=false` in production
2. **API Rate Limiting**: Configure appropriate limits for production
3. **CORS**: Restrict to your domain only
4. **Environment Variables**: Never expose in client-side code