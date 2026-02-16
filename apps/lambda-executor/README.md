# Lambda Executor — Heavy Language Execution

AWS Lambda container image for executing Java, C++, and C code.

## Architecture

This is **Tier 2 execution** — only used for ~20% of code executions (heavy languages).

| Language | Tier | Latency |
|----------|------|---------|
| Python | Edge (Pyodide) | <100ms |
| JavaScript | Edge (V8) | <50ms |
| SQL | Edge (D1) | <50ms |
| **Java** | Lambda | 1-5s |
| **C++** | Lambda | 1-3s |
| **C** | Lambda | 1-3s |

## Build & Deploy

### Prerequisites
- AWS CLI configured
- Docker installed
- ECR repository created

### Create ECR Repository (one-time)
```bash
aws ecr create-repository --repository-name piston-executor --region us-east-1
```

### Build & Push
```bash
# Set your AWS account ID
export AWS_ACCOUNT=123456789012

# Build and deploy
npm run deploy
```

### Create Lambda Function
```bash
aws lambda create-function \
  --function-name devcapsules-executor \
  --package-type Image \
  --code ImageUri=$AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/piston-executor:latest \
  --role arn:aws:iam::$AWS_ACCOUNT:role/lambda-execution-role \
  --memory-size 1024 \
  --timeout 30 \
  --architecture arm64 \
  --environment "Variables={API_KEY=your-secret-api-key}"
```

### Create Function URL
```bash
aws lambda create-function-url-config \
  --function-name devcapsules-executor \
  --auth-type NONE

# Get the URL
aws lambda get-function-url-config --function-name devcapsules-executor
```

## Testing

```bash
curl -X POST https://YOUR_LAMBDA_URL/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{
    "language": "java",
    "source_code": "public class Main { public static void main(String[] args) { System.out.println(\"Hello\"); } }"
  }'
```

## Cost Estimation

| Executions/Month | Lambda Cost |
|------------------|-------------|
| 100 | ~$0.10 |
| 1,000 | ~$1.00 |
| 10,000 | ~$10.00 |

Compared to EC2 at $30-80/month running 24/7.
