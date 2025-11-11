# Terraform Outputs
# Export important values from the CodeCapsule serverless infrastructure deployment

# ===== API GATEWAY OUTPUTS =====

output "api_gateway_url" {
  description = "Base URL for the CodeCapsule API Gateway"
  value       = aws_api_gateway_deployment.codecapsule_deployment.invoke_url
  sensitive   = false
}

output "api_gateway_id" {
  description = "API Gateway REST API identifier"
  value       = aws_api_gateway_rest_api.codecapsule_api.id
  sensitive   = false
}

output "api_gateway_execution_arn" {
  description = "API Gateway execution ARN for Lambda permissions"
  value       = aws_api_gateway_rest_api.codecapsule_api.execution_arn
  sensitive   = false
}

output "api_gateway_stage_name" {
  description = "API Gateway deployment stage name"
  value       = var.api_gateway_stage_name
  sensitive   = false
}

# ===== API ENDPOINTS =====

output "api_endpoints" {
  description = "All available API endpoints for the CodeCapsule execution engine"
  value = {
    health_check        = "${aws_api_gateway_deployment.codecapsule_deployment.invoke_url}/health"
    python_execution    = "${aws_api_gateway_deployment.codecapsule_deployment.invoke_url}/execute/python"
    javascript_execution = "${aws_api_gateway_deployment.codecapsule_deployment.invoke_url}/execute/javascript"
    sql_execution       = "${aws_api_gateway_deployment.codecapsule_deployment.invoke_url}/execute/sql"
    java_execution      = "${aws_api_gateway_deployment.codecapsule_deployment.invoke_url}/execute/java"
    csharp_execution    = "${aws_api_gateway_deployment.codecapsule_deployment.invoke_url}/execute/csharp"
    go_execution        = "${aws_api_gateway_deployment.codecapsule_deployment.invoke_url}/execute/go"
  }
  sensitive = false
}

output "api_endpoints_curl_examples" {
  description = "Example curl commands for testing API endpoints"
  value = {
    health_check = "curl -X GET ${aws_api_gateway_deployment.codecapsule_deployment.invoke_url}/health"
    python_test = "curl -X POST ${aws_api_gateway_deployment.codecapsule_deployment.invoke_url}/execute/python -H 'Content-Type: application/json' -d '{\"code\":\"print(\\\"Hello, World!\\\")\"}'"
    javascript_test = "curl -X POST ${aws_api_gateway_deployment.codecapsule_deployment.invoke_url}/execute/javascript -H 'Content-Type: application/json' -d '{\"code\":\"console.log(\\\"Hello, World!\\\")\"}'"
    sql_test = "curl -X POST ${aws_api_gateway_deployment.codecapsule_deployment.invoke_url}/execute/sql -H 'Content-Type: application/json' -d '{\"code\":\"SELECT 1 as test_value\"}'"
    java_test = "curl -X POST ${aws_api_gateway_deployment.codecapsule_deployment.invoke_url}/execute/java -H 'Content-Type: application/json' -d '{\"code\":\"public class HelloWorld { public static void main(String[] args) { System.out.println(\\\"Hello, World!\\\"); } }\"}'"
    csharp_test = "curl -X POST ${aws_api_gateway_deployment.codecapsule_deployment.invoke_url}/execute/csharp -H 'Content-Type: application/json' -d '{\"code\":\"using System; class Program { static void Main() { Console.WriteLine(\\\"Hello, World!\\\"); } }\"}'"
    go_test = "curl -X POST ${aws_api_gateway_deployment.codecapsule_deployment.invoke_url}/execute/go -H 'Content-Type: application/json' -d '{\"code\":\"package main\\\\nimport \\\"fmt\\\"\\\\nfunc main() { fmt.Println(\\\"Hello, World!\\\") }\"}'"
  }
  sensitive = false
}

# ===== LAMBDA FUNCTION OUTPUTS =====

output "lambda_functions" {
  description = "Details of all deployed Lambda functions"
  value = {
    python_judge = {
      function_name = aws_lambda_function.python_judge.function_name
      function_arn  = aws_lambda_function.python_judge.arn
      invoke_arn    = aws_lambda_function.python_judge.invoke_arn
      runtime       = aws_lambda_function.python_judge.runtime
      memory_size   = aws_lambda_function.python_judge.memory_size
      timeout       = aws_lambda_function.python_judge.timeout
    }
    javascript_judge = {
      function_name = aws_lambda_function.javascript_judge.function_name
      function_arn  = aws_lambda_function.javascript_judge.arn
      invoke_arn    = aws_lambda_function.javascript_judge.invoke_arn
      runtime       = aws_lambda_function.javascript_judge.runtime
      memory_size   = aws_lambda_function.javascript_judge.memory_size
      timeout       = aws_lambda_function.javascript_judge.timeout
    }
    sql_judge = {
      function_name = aws_lambda_function.sql_judge.function_name
      function_arn  = aws_lambda_function.sql_judge.arn
      invoke_arn    = aws_lambda_function.sql_judge.invoke_arn
      runtime       = aws_lambda_function.sql_judge.runtime
      memory_size   = aws_lambda_function.sql_judge.memory_size
      timeout       = aws_lambda_function.sql_judge.timeout
    }
    health_check = {
      function_name = aws_lambda_function.health_check.function_name
      function_arn  = aws_lambda_function.health_check.arn
      invoke_arn    = aws_lambda_function.health_check.invoke_arn
      runtime       = aws_lambda_function.health_check.runtime
      memory_size   = aws_lambda_function.health_check.memory_size
      timeout       = aws_lambda_function.health_check.timeout
    }
  }
  sensitive = false
}

# Individual function outputs for easier access
output "python_judge_function_name" {
  description = "Python judge Lambda function name"
  value       = aws_lambda_function.python_judge.function_name
  sensitive   = false
}

output "javascript_judge_function_name" {
  description = "JavaScript judge Lambda function name"
  value       = aws_lambda_function.javascript_judge.function_name
  sensitive   = false
}

output "sql_judge_function_name" {
  description = "SQL judge Lambda function name"
  value       = aws_lambda_function.sql_judge.function_name
  sensitive   = false
}

output "health_check_function_name" {
  description = "Health check Lambda function name"
  value       = aws_lambda_function.health_check.function_name
  sensitive   = false
}

# ===== IAM OUTPUTS =====

output "lambda_execution_role" {
  description = "IAM role used by all Lambda functions"
  value = {
    arn  = aws_iam_role.lambda_execution_role.arn
    name = aws_iam_role.lambda_execution_role.name
  }
  sensitive = false
}

# ===== CLOUDWATCH OUTPUTS =====

output "cloudwatch_log_groups" {
  description = "CloudWatch log groups for all Lambda functions"
  value = {
    python_judge    = aws_cloudwatch_log_group.python_judge_log_group.name
    javascript_judge = aws_cloudwatch_log_group.javascript_judge_log_group.name
    sql_judge       = aws_cloudwatch_log_group.sql_judge_log_group.name
    health_check    = aws_cloudwatch_log_group.health_check_log_group.name
  }
  sensitive = false
}

# ===== DEPLOYMENT INFORMATION =====

output "deployment_info" {
  description = "Information about the current deployment"
  value = {
    region              = var.aws_region
    environment         = var.environment
    project_name        = var.project_name
    terraform_version   = "~> 1.0"
    aws_provider_version = "~> 5.0"
    deployment_timestamp = timestamp()
  }
  sensitive = false
}

# ===== CONFIGURATION OUTPUTS =====

output "configuration" {
  description = "Current configuration values (non-sensitive only)"
  value = {
    lambda_timeout      = var.lambda_timeout
    lambda_memory_size  = var.lambda_memory_size
    python_runtime      = var.python_runtime
    nodejs_runtime      = var.nodejs_runtime
    log_retention_days  = var.log_retention_days
    xray_tracing_enabled = var.enable_xray_tracing
    api_caching_enabled = var.enable_api_caching
  }
  sensitive = false
}

# ===== MONITORING OUTPUTS =====

output "monitoring" {
  description = "Monitoring and logging endpoints"
  value = {
    cloudwatch_logs_url = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#logsV2:log-groups"
    xray_traces_url     = var.enable_xray_tracing ? "https://${var.aws_region}.console.aws.amazon.com/xray/home?region=${var.aws_region}#/traces" : null
    api_gateway_logs    = "https://${var.aws_region}.console.aws.amazon.com/apigateway/home?region=${var.aws_region}#/apis/${aws_api_gateway_rest_api.codecapsule_api.id}/stages/${var.api_gateway_stage_name}/logs"
  }
  sensitive = false
}

# ===== TESTING OUTPUTS =====

output "testing_commands" {
  description = "Commands to test the deployed infrastructure"
  value = {
    test_health = "curl -s ${aws_api_gateway_deployment.codecapsule_deployment.invoke_url}/health | jq"
    test_python = "curl -s -X POST ${aws_api_gateway_deployment.codecapsule_deployment.invoke_url}/execute/python -H 'Content-Type: application/json' -d '{\"code\":\"print(2+2)\"}' | jq"
    test_javascript = "curl -s -X POST ${aws_api_gateway_deployment.codecapsule_deployment.invoke_url}/execute/javascript -H 'Content-Type: application/json' -d '{\"code\":\"console.log(2+2)\"}' | jq"
    load_test_python = "for i in {1..10}; do curl -s -X POST ${aws_api_gateway_deployment.codecapsule_deployment.invoke_url}/execute/python -H 'Content-Type: application/json' -d '{\"code\":\"print('Hello '$i')\"}' & done; wait"
  }
  sensitive = false
}

# ===== RESOURCE COUNTS =====

output "resource_summary" {
  description = "Summary of deployed resources"
  value = {
    lambda_functions     = 4
    api_gateway_apis     = 1
    api_gateway_methods  = 8  # 4 POST + 3 OPTIONS + 1 GET
    iam_roles           = 2   # Lambda execution + API Gateway CloudWatch
    cloudwatch_log_groups = 4
    api_endpoints       = 4
  }
  sensitive = false
}

# ===== COST ESTIMATION =====

output "estimated_monthly_costs" {
  description = "Rough monthly cost estimation (USD) for typical usage"
  value = {
    note = "Estimates based on 1M executions/month, 512MB memory, 1s average duration"
    lambda_compute = "~$8.33 (1M executions * 512MB * 1s)"
    lambda_requests = "~$0.20 (1M requests)"
    api_gateway = "~$3.50 (1M API calls)"
    cloudwatch_logs = "~$0.50 (standard logging)"
    total_estimated = "~$12.53/month"
    vs_judge0_cost = "Judge0 RapidAPI: ~$200-500/month for same volume"
    savings = "90%+ cost savings vs Judge0"
  }
  sensitive = false
}