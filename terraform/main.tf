# CodeCapsule Serverless Execution Engine - Terraform Configuration
# Deploys Lambda functions, API Gateway, and all infrastructure for the serverless Judge0 replacement

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

# Configure AWS Provider
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "CodeCapsule"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Component   = "ServerlessExecution"
    }
  }
}

# Note: Variables are defined in variables.tf
# Note: Local values are defined in variables.tf

# ===== IAM ROLES AND POLICIES =====

# Lambda execution role
resource "aws_iam_role" "lambda_execution_role" {
  name = "${local.function_name_prefix}-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Lambda basic execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_execution_role.name
}

# X-Ray tracing policy
resource "aws_iam_role_policy_attachment" "lambda_xray_write_only" {
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
  role       = aws_iam_role.lambda_execution_role.name
}

# ===== LAMBDA FUNCTIONS =====

# Create ZIP files for Lambda functions
data "archive_file" "python_judge_zip" {
  type        = "zip"
  source_file = "${local.lambda_source_path}/python-judge.py"
  output_path = "${path.module}/lambda-zips/python-judge.zip"
}

# Use pre-built JavaScript Lambda zip with vm2 dependency
locals {
  javascript_judge_zip_path = "${path.module}/lambda-zips/javascript-judge-fixed.zip"
}

# Use pre-built SQL Lambda zip with API Gateway event handling
locals {
  sql_judge_zip_path = "${path.module}/lambda-zips/sql-judge-fixed.zip"
}

# Python Judge Lambda Function
resource "aws_lambda_function" "python_judge" {
  filename         = data.archive_file.python_judge_zip.output_path
  function_name    = "${local.function_name_prefix}-python-judge"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "python-judge.lambda_handler"
  source_code_hash = data.archive_file.python_judge_zip.output_base64sha256
  runtime         = "python3.11"
  timeout         = 30
  memory_size     = 512

  environment {
    variables = {
      LOG_LEVEL    = "INFO"
      PYTHONPATH   = "/var/runtime:/var/task"
    }
  }

  tracing_config {
    mode = "Active"
  }

  description = "CodeCapsule Python code execution judge"

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_cloudwatch_log_group.python_judge_log_group
  ]
}

# JavaScript Judge Lambda Function  
resource "aws_lambda_function" "javascript_judge" {
  filename         = local.javascript_judge_zip_path
  function_name    = "${local.function_name_prefix}-javascript-judge"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256(local.javascript_judge_zip_path)
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 512

  environment {
    variables = {
      NODE_ENV   = "production"
      LOG_LEVEL  = "INFO"
    }
  }

  tracing_config {
    mode = "Active"
  }

  description = "CodeCapsule JavaScript code execution judge with VM2 sandboxing"

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_cloudwatch_log_group.javascript_judge_log_group
  ]
}

# SQL Judge Lambda Function
resource "aws_lambda_function" "sql_judge" {
  filename         = local.sql_judge_zip_path
  function_name    = "${local.function_name_prefix}-sql-judge"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "sql-judge.lambda_handler"
  source_code_hash = filebase64sha256(local.sql_judge_zip_path)
  runtime         = "python3.11"
  timeout         = 30
  memory_size     = 256

  environment {
    variables = {
      SUPABASE_URL         = var.supabase_url
      SUPABASE_SERVICE_KEY = var.supabase_service_key
      DB_HOST              = var.db_host
      DB_NAME              = "postgres"
      DB_USER              = var.db_user
      DB_PASSWORD          = var.db_password
      LOG_LEVEL           = "INFO"
      PYTHONPATH          = "/var/runtime:/var/task"
    }
  }

  tracing_config {
    mode = "Active"
  }

  description = "CodeCapsule SQL query execution judge with Supabase integration"

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_cloudwatch_log_group.sql_judge_log_group
  ]
}

# SQL Validator Lambda Function (for capsule generation validation)
resource "aws_lambda_function" "sql_validator" {
  filename         = "${path.module}/lambda-zips/sql-validator.zip"
  function_name    = "${local.function_name_prefix}-sql-validator"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "lambda_function.lambda_handler"
  source_code_hash = filebase64sha256("${path.module}/lambda-zips/sql-validator.zip")
  runtime         = "python3.11"
  timeout         = 30
  memory_size     = 512

  environment {
    variables = {
      DB_HOST              = var.db_host
      DB_NAME              = "postgres"
      DB_USER              = var.db_user
      DB_PASSWORD          = var.db_password
      LOG_LEVEL           = "INFO"
      PYTHONPATH          = "/var/runtime:/var/task"
    }
  }

  tracing_config {
    mode = "Active"
  }

  description = "CodeCapsule SQL capsule validator with SQLite and PostgreSQL support"

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_cloudwatch_log_group.sql_validator_log_group
  ]
}

# ===== CLOUDWATCH LOG GROUPS =====

resource "aws_cloudwatch_log_group" "python_judge_log_group" {
  name              = "/aws/lambda/${local.function_name_prefix}-python-judge"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "javascript_judge_log_group" {
  name              = "/aws/lambda/${local.function_name_prefix}-javascript-judge"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "sql_judge_log_group" {
  name              = "/aws/lambda/${local.function_name_prefix}-sql-judge"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "sql_validator_log_group" {
  name              = "/aws/lambda/${local.function_name_prefix}-sql-validator"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "health_check_log_group" {
  name              = "/aws/lambda/${local.function_name_prefix}-health-check"
  retention_in_days = 7
}

# ===== API GATEWAY =====

# API Gateway REST API
resource "aws_api_gateway_rest_api" "codecapsule_api" {
  name        = "codecapsule-${var.environment}-api"
  description = "CodeCapsule Serverless Execution API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  binary_media_types = ["application/octet-stream"]
}

# API Gateway deployment
resource "aws_api_gateway_deployment" "codecapsule_deployment" {
  depends_on = [
    aws_api_gateway_method.python_execute_post,
    aws_api_gateway_method.javascript_execute_post,
    aws_api_gateway_method.sql_execute_post,
    aws_api_gateway_method.java_execute_post,
    # aws_api_gateway_method.csharp_execute_post,  # Commented out
    # aws_api_gateway_method.go_execute_post,  # Commented out
    aws_api_gateway_method.health_check_get,
    aws_api_gateway_method.validate_sql_post,
    aws_api_gateway_integration.python_execute_post,
    aws_api_gateway_integration.javascript_execute_post,
    aws_api_gateway_integration.sql_execute_post,
    aws_api_gateway_integration.java_execute_post,
    # aws_api_gateway_integration.csharp_execute_post,  # Commented out
    # aws_api_gateway_integration.go_execute_post,  # Commented out
    aws_api_gateway_integration.health_check_get,
    aws_api_gateway_integration.validate_sql_post,
    aws_api_gateway_integration.python_execute_options,
    aws_api_gateway_integration.javascript_execute_options,
    aws_api_gateway_integration.sql_execute_options,
    aws_api_gateway_integration.java_execute_options,
    aws_api_gateway_integration.csharp_execute_options,
    aws_api_gateway_integration.go_execute_options,
    aws_api_gateway_integration.validate_sql_options
  ]

  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  stage_name  = var.api_gateway_stage_name

  variables = {
    deployed_at = timestamp()
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Enable CloudWatch logging for API Gateway
resource "aws_api_gateway_account" "codecapsule_api_account" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch_role.arn
}

# IAM role for API Gateway CloudWatch logging
resource "aws_iam_role" "api_gateway_cloudwatch_role" {
  name = "${local.function_name_prefix}-apigateway-cloudwatch-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "api_gateway_cloudwatch_policy" {
  name = "${local.function_name_prefix}-apigateway-cloudwatch-policy"
  role = aws_iam_role.api_gateway_cloudwatch_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:PutLogEvents",
          "logs:GetLogEvents",
          "logs:FilterLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

# ===== API GATEWAY RESOURCES AND METHODS =====

# /execute resource
resource "aws_api_gateway_resource" "execute" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  parent_id   = aws_api_gateway_rest_api.codecapsule_api.root_resource_id
  path_part   = "execute"
}

# /execute/python resource
resource "aws_api_gateway_resource" "execute_python" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  parent_id   = aws_api_gateway_resource.execute.id
  path_part   = "python"
}

# /execute/javascript resource
resource "aws_api_gateway_resource" "execute_javascript" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  parent_id   = aws_api_gateway_resource.execute.id
  path_part   = "javascript"
}

# /execute/sql resource
resource "aws_api_gateway_resource" "execute_sql" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  parent_id   = aws_api_gateway_resource.execute.id
  path_part   = "sql"
}

# /execute/java resource
resource "aws_api_gateway_resource" "execute_java" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  parent_id   = aws_api_gateway_resource.execute.id
  path_part   = "java"
}

# /execute/csharp resource
resource "aws_api_gateway_resource" "execute_csharp" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  parent_id   = aws_api_gateway_resource.execute.id
  path_part   = "csharp"
}

# /execute/go resource
resource "aws_api_gateway_resource" "execute_go" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  parent_id   = aws_api_gateway_resource.execute.id
  path_part   = "go"
}

# /validate resource
resource "aws_api_gateway_resource" "validate" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  parent_id   = aws_api_gateway_rest_api.codecapsule_api.root_resource_id
  path_part   = "validate"
}

# /validate/sql resource
resource "aws_api_gateway_resource" "validate_sql" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  parent_id   = aws_api_gateway_resource.validate.id
  path_part   = "sql"
}

# /health resource
resource "aws_api_gateway_resource" "health" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  parent_id   = aws_api_gateway_rest_api.codecapsule_api.root_resource_id
  path_part   = "health"
}