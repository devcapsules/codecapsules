# CodeCapsule Serverless Infrastructure - Terraform Deployment

This directory contains Terraform configuration files for deploying the CodeCapsule serverless execution engine to AWS.

## Architecture Overview

The infrastructure includes:
- **4 Lambda Functions**: Python, JavaScript, SQL judges + Health check
- **API Gateway**: RESTful API with CORS support
- **CloudWatch**: Logging and monitoring
- **IAM Roles**: Secure service permissions
- **X-Ray**: Distributed tracing (optional)

## Quick Start

### Prerequisites
- AWS CLI configured with appropriate credentials
- Terraform >= 1.0 installed
- jq installed (for testing JSON responses)

### 1. Configure Variables
Copy the example variables file and customize:
```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### 2. Initialize Terraform
```bash
terraform init
```

### 3. Plan Deployment
```bash
terraform plan
```

### 4. Deploy Infrastructure
```bash
terraform apply
```

### 5. Test Deployment
```bash
# Health check
curl $(terraform output -raw api_gateway_url)/health | jq

# Python execution test  
curl -X POST $(terraform output -raw api_gateway_url)/execute/python \
  -H 'Content-Type: application/json' \
  -d '{"code":"print(2+2)"}' | jq

# JavaScript execution test
curl -X POST $(terraform output -raw api_gateway_url)/execute/javascript \
  -H 'Content-Type: application/json' \
  -d '{"code":"console.log(2+2)"}' | jq
```

## Configuration

### Required Variables
Create a `terraform.tfvars` file with these values:

```hcl
# Core Configuration
aws_region = "us-east-1"
environment = "prod"

# Database Configuration (for SQL judge)
supabase_url = "https://your-project.supabase.co"
supabase_service_key = "your-service-key"
db_host = "your-db-host.supabase.co"
db_user = "readonly_user"
db_password = "your-secure-password"

# Optional: Monitoring
alarm_email_endpoint = "alerts@yourcompany.com"
```

### Environment Variables (Alternative)
Instead of `terraform.tfvars`, you can use environment variables:

```bash
export TF_VAR_supabase_url="https://your-project.supabase.co"
export TF_VAR_supabase_service_key="your-service-key"
export TF_VAR_db_host="your-db-host.supabase.co"
export TF_VAR_db_user="readonly_user"  
export TF_VAR_db_password="your-secure-password"
```

## File Structure

```
terraform/
├── main.tf                    # Core infrastructure (Lambda functions, IAM)
├── api-gateway.tf            # API Gateway configuration with CORS
├── variables.tf              # Variable definitions with validation
├── outputs.tf                # Output values and testing commands
├── terraform.tfvars.example  # Example configuration file
├── README.md                 # This file
└── lambda-zips/              # Generated ZIP files (auto-created)
```

## API Endpoints

After deployment, you'll have these endpoints:

- **Health Check**: `GET /health`
- **Python Execution**: `POST /execute/python`
- **JavaScript Execution**: `POST /execute/javascript`  
- **SQL Execution**: `POST /execute/sql`

### Request Format
```json
{
  "code": "your-code-here",
  "timeout": 10,
  "memory_limit": "128MB"
}
```

### Response Format
```json
{
  "success": true,
  "output": "execution-output",
  "error": null,
  "execution_time": 0.123,
  "memory_used": "45MB"
}
```

## Security Features

- **IAM Least Privilege**: Lambda functions have minimal required permissions
- **CORS Configuration**: Configurable cross-origin resource sharing
- **API Throttling**: Rate limiting to prevent abuse
- **CloudWatch Logging**: All requests and errors logged
- **X-Ray Tracing**: Optional distributed tracing for debugging

## Monitoring

### CloudWatch Dashboards
Access logs and metrics:
```bash
# View all log groups
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/codecapsule"

# Stream logs in real-time
aws logs tail "/aws/lambda/codecapsule-prod-python-judge" --follow
```

### Cost Monitoring
The infrastructure is designed for cost efficiency:
- **Lambda**: Pay per execution (no idle costs)
- **API Gateway**: $3.50 per million API calls
- **CloudWatch**: Minimal logging costs
- **Estimated Monthly Cost**: ~$12-15 for 1M executions

## Troubleshooting

### Common Issues

**1. Lambda Function Not Found**
```bash
# Check if functions were created
aws lambda list-functions --query 'Functions[?contains(FunctionName, `codecapsule`)]'
```

**2. API Gateway 403 Errors**
- Check CORS configuration in `api-gateway.tf`
- Verify Lambda permissions are properly set

**3. Database Connection Issues (SQL Judge)**
- Validate Supabase credentials in `terraform.tfvars`
- Check security group rules for database access

**4. Memory/Timeout Issues**
Adjust in `terraform.tfvars`:
```hcl
lambda_timeout = 60      # Increase timeout
lambda_memory_size = 1024 # Increase memory
```

### Debugging Commands
```bash
# Check Terraform state
terraform show

# View outputs
terraform output

# Check AWS resources
aws apigateway get-rest-apis
aws lambda list-functions

# Test endpoints with verbose output
curl -v -X POST $(terraform output -raw api_gateway_url)/execute/python \
  -H 'Content-Type: application/json' \
  -d '{"code":"print(\"Debug test\")"}'
```

## Cleanup

To remove all resources:
```bash
terraform destroy
```

**Warning**: This will permanently delete all Lambda functions, API Gateway, and associated resources.

## Advanced Configuration

### Custom Domains
To use a custom domain, add to `main.tf`:
```hcl
resource "aws_api_gateway_domain_name" "custom_domain" {
  domain_name     = "api.yourdomain.com"
  certificate_arn = aws_acm_certificate.cert.arn
}
```

### VPC Configuration  
To deploy Lambda functions in a VPC:
```hcl
resource "aws_lambda_function" "python_judge" {
  # ... existing configuration ...
  
  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = [aws_security_group.lambda_sg.id]
  }
}
```

### Environment-Specific Deployments
Use Terraform workspaces:
```bash
# Create development environment
terraform workspace new dev
terraform apply -var="environment=dev"

# Switch to production
terraform workspace select prod  
terraform apply -var="environment=prod"
```

## Support

For issues and questions:
1. Check the [troubleshooting section](#troubleshooting)
2. Review CloudWatch logs for detailed error information
3. Validate your `terraform.tfvars` configuration
4. Ensure AWS credentials have sufficient permissions

## Cost Optimization Tips

1. **Adjust Memory**: Start with 512MB, monitor actual usage
2. **Set Appropriate Timeouts**: Don't over-provision timeout values
3. **Use Reserved Capacity**: For high-volume production workloads
4. **Monitor Costs**: Set up AWS Cost Alerts for the project