# Terraform Variables Configuration
# Define all input variables for the CodeCapsule serverless infrastructure

# ===== CORE CONFIGURATION =====

variable "aws_region" {
  description = "AWS region where resources will be deployed"
  type        = string
  default     = "us-east-1"
  
  validation {
    condition = contains([
      "us-east-1", "us-east-2", "us-west-1", "us-west-2",
      "eu-west-1", "eu-west-2", "eu-central-1", "ap-southeast-1",
      "ap-southeast-2", "ap-northeast-1"
    ], var.aws_region)
    error_message = "AWS region must be a valid region with Lambda support."
  }
}

variable "environment" {
  description = "Environment name for resource tagging and naming (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = can(regex("^(dev|staging|prod)$", var.environment))
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "project_name" {
  description = "Project name for resource naming and tagging"
  type        = string
  default     = "codecapsule"
  
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }
}

# ===== SUPABASE CONFIGURATION =====

variable "supabase_url" {
  description = "Supabase project URL for database connectivity"
  type        = string
  default     = ""
  sensitive   = true
  
  validation {
    condition     = var.supabase_url == "" || can(regex("^https://[a-z0-9]+\\.supabase\\.co$", var.supabase_url))
    error_message = "Supabase URL must be empty or a valid Supabase project URL."
  }
}

variable "supabase_service_key" {
  description = "Supabase service role key for serverless function access"
  type        = string
  default     = ""
  sensitive   = true
}

# ===== DATABASE CONFIGURATION =====

variable "db_host" {
  description = "Database host for SQL query execution"
  type        = string
  default     = ""
  sensitive   = true
}

variable "db_name" {
  description = "Database name for SQL queries"
  type        = string
  default     = "postgres"
}

variable "db_user" {
  description = "Database user for SQL query execution (read-only recommended)"
  type        = string
  default     = "readonly_user"
  sensitive   = true
}

variable "db_password" {
  description = "Database password for SQL query execution"
  type        = string
  default     = ""
  sensitive   = true
}

variable "db_port" {
  description = "Database port number"
  type        = number
  default     = 5432
  
  validation {
    condition     = var.db_port > 0 && var.db_port <= 65535
    error_message = "Database port must be between 1 and 65535."
  }
}

# ===== LAMBDA CONFIGURATION =====

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
  
  validation {
    condition     = var.lambda_timeout >= 3 && var.lambda_timeout <= 900
    error_message = "Lambda timeout must be between 3 and 900 seconds."
  }
}

variable "lambda_memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 512
  
  validation {
    condition     = var.lambda_memory_size >= 128 && var.lambda_memory_size <= 3008
    error_message = "Lambda memory size must be between 128 and 3008 MB."
  }
}

variable "python_runtime" {
  description = "Python runtime version for Lambda functions"
  type        = string
  default     = "python3.11"
  
  validation {
    condition     = contains(["python3.8", "python3.9", "python3.10", "python3.11"], var.python_runtime)
    error_message = "Python runtime must be a supported version."
  }
}

variable "nodejs_runtime" {
  description = "Node.js runtime version for Lambda functions"
  type        = string
  default     = "nodejs18.x"
  
  validation {
    condition     = contains(["nodejs16.x", "nodejs18.x", "nodejs20.x"], var.nodejs_runtime)
    error_message = "Node.js runtime must be a supported version."
  }
}

# ===== CLOUDWATCH CONFIGURATION =====

variable "log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 7
  
  validation {
    condition = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.log_retention_days)
    error_message = "Log retention days must be a valid CloudWatch retention period."
  }
}

variable "enable_xray_tracing" {
  description = "Enable AWS X-Ray tracing for Lambda functions"
  type        = bool
  default     = true
}

# ===== API GATEWAY CONFIGURATION =====

variable "api_gateway_stage_name" {
  description = "API Gateway deployment stage name"
  type        = string
  default     = "prod"
  
  validation {
    condition     = can(regex("^[a-zA-Z0-9-_]+$", var.api_gateway_stage_name))
    error_message = "API Gateway stage name must contain only alphanumeric characters, hyphens, and underscores."
  }
}

variable "enable_api_caching" {
  description = "Enable API Gateway caching"
  type        = bool
  default     = false
}

variable "api_cache_ttl_seconds" {
  description = "API Gateway cache TTL in seconds"
  type        = number
  default     = 300
  
  validation {
    condition     = var.api_cache_ttl_seconds >= 0 && var.api_cache_ttl_seconds <= 3600
    error_message = "API cache TTL must be between 0 and 3600 seconds."
  }
}

# ===== CORS CONFIGURATION =====

variable "cors_allow_origins" {
  description = "Allowed origins for CORS (use ['*'] for all origins)"
  type        = list(string)
  default     = ["*"]
}

variable "cors_allow_methods" {
  description = "Allowed HTTP methods for CORS"
  type        = list(string)
  default     = ["GET", "POST", "OPTIONS"]
}

variable "cors_allow_headers" {
  description = "Allowed headers for CORS"
  type        = list(string)
  default     = ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token"]
}

# ===== SECURITY CONFIGURATION =====

variable "enable_api_key" {
  description = "Enable API key authentication for API Gateway"
  type        = bool
  default     = false
}

variable "api_key_usage_plan_name" {
  description = "Usage plan name for API key"
  type        = string
  default     = "codecapsule-usage-plan"
}

variable "api_throttle_rate_limit" {
  description = "API Gateway throttle rate limit (requests per second)"
  type        = number
  default     = 1000
}

variable "api_throttle_burst_limit" {
  description = "API Gateway throttle burst limit"
  type        = number
  default     = 2000
}

# ===== MONITORING CONFIGURATION =====

variable "enable_detailed_monitoring" {
  description = "Enable detailed CloudWatch monitoring"
  type        = bool
  default     = true
}

variable "alarm_email_endpoint" {
  description = "Email address for CloudWatch alarm notifications (leave empty to disable)"
  type        = string
  default     = ""
  
  validation {
    condition = var.alarm_email_endpoint == "" || can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.alarm_email_endpoint))
    error_message = "Alarm email must be empty or a valid email address."
  }
}

# ===== DEPLOYMENT CONFIGURATION =====

variable "force_destroy_resources" {
  description = "Allow Terraform to destroy resources that would normally be protected"
  type        = bool
  default     = false
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for critical resources"
  type        = bool
  default     = false
}

# ===== TAGS =====

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
  
  validation {
    condition = alltrue([
      for k, v in var.additional_tags : can(regex("^[a-zA-Z0-9\\s\\-\\._:/=+@]*$", k)) && can(regex("^[a-zA-Z0-9\\s\\-\\._:/=+@]*$", v))
    ])
    error_message = "Tag keys and values must contain only valid AWS tag characters."
  }
}

# ===== LOCAL VALUES =====

locals {
  # Common tags applied to all resources
  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      Component   = "ServerlessExecution"
      CreatedBy   = "CodeCapsule"
    },
    var.additional_tags
  )
  
  # Function naming convention
  function_name_prefix = "${var.project_name}-${var.environment}"
  
  # Lambda source path
  lambda_source_path = "../packages/runtime/lambda-functions"
  
  # CORS configuration
  cors_headers_string = join(",", [for header in var.cors_allow_headers : "'${header}'"])
  cors_methods_string = join(",", [for method in var.cors_allow_methods : "'${method}'"])
  cors_origins_string = length(var.cors_allow_origins) == 1 && var.cors_allow_origins[0] == "*" ? "'*'" : join(",", [for origin in var.cors_allow_origins : "'${origin}'"])
}