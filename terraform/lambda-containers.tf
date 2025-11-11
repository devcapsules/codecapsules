# ECR Repositories for Container-based Lambda Functions
resource "aws_ecr_repository" "java_lambda" {
  name                 = "codecapsule-java-lambda"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "CodeCapsule Java Lambda"
    Environment = "production"
  }
}

resource "aws_ecr_repository" "csharp_lambda" {
  name                 = "codecapsule-csharp-lambda"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "codecapsule-csharp-lambda"
    Environment = "production"
  }
}

resource "aws_ecr_repository" "go_lambda" {
  name                 = "codecapsule-go-lambda"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "CodeCapsule Go Lambda"
    Environment = "production"
  }
}

# IAM Role for Container Lambda Functions
resource "aws_iam_role" "container_lambda_role" {
  name = "codecapsule-container-lambda-role"

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

  tags = {
    Name        = "CodeCapsule Container Lambda Role"
    Environment = "production"
  }
}

# Attach basic execution policy
resource "aws_iam_role_policy_attachment" "container_lambda_basic" {
  role       = aws_iam_role.container_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Java Lambda Function (Container-based)
resource "aws_lambda_function" "java_executor" {
  function_name = "codecapsule-java-executor"
  role         = aws_iam_role.container_lambda_role.arn
  package_type = "Image"
  image_uri    = "${aws_ecr_repository.java_lambda.repository_url}:v4"
  
  timeout     = 30
  memory_size = 1024

  environment {
    variables = {
      WORKSPACE_PATH = "/tmp/workspace"
    }
  }

  tags = {
    Name        = "CodeCapsule Java Executor"
    Environment = "production"
    Language    = "java"
  }

  # Depends on the ECR repository
  depends_on = [aws_ecr_repository.java_lambda]
}

# C# Lambda Function (Container-based)
resource "aws_lambda_function" "csharp_executor" {
  function_name = "codecapsule-csharp-executor"
  role         = aws_iam_role.container_lambda_role.arn
  package_type = "Image"
  image_uri    = "${aws_ecr_repository.csharp_lambda.repository_url}:latest"
  
  timeout     = 30
  memory_size = 1024

  environment {
    variables = {
      WORKSPACE_PATH = "/tmp/workspace"
    }
  }

  tags = {
    Name        = "CodeCapsule CSharp Executor"
    Environment = "production"
    Language    = "csharp"
  }

  depends_on = [aws_ecr_repository.csharp_lambda]
}

# Go Lambda Function (Container-based)
resource "aws_lambda_function" "go_executor" {
  function_name = "codecapsule-go-executor"
  role         = aws_iam_role.container_lambda_role.arn
  package_type = "Image"
  image_uri    = "${aws_ecr_repository.go_lambda.repository_url}:latest"
  
  timeout     = 30
  memory_size = 1024

  environment {
    variables = {
      WORKSPACE_PATH = "/tmp/workspace"
    }
  }

  tags = {
    Name        = "CodeCapsule Go Executor"
    Environment = "production"
    Language    = "go"
  }

  depends_on = [aws_ecr_repository.go_lambda]
}

# Container Lambda Functions will be integrated later
# For now, we'll create ECR repositories and Lambda functions
# API Gateway integration will be added after container deployment

# Output ECR repository URLs for Docker push
output "java_ecr_repository_url" {
  description = "ECR repository URL for Java Lambda"
  value       = aws_ecr_repository.java_lambda.repository_url
}

output "csharp_ecr_repository_url" {
  description = "ECR repository URL for C# Lambda"
  value       = aws_ecr_repository.csharp_lambda.repository_url
}

output "go_ecr_repository_url" {
  description = "ECR repository URL for Go Lambda"
  value       = aws_ecr_repository.go_lambda.repository_url
}