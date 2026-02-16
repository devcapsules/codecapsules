# ===== CORS CONFIGURATION =====

# Options method for CORS pre-flight requests
resource "aws_api_gateway_method" "python_execute_options" {
  rest_api_id   = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id   = aws_api_gateway_resource.execute_python.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "python_execute_options" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.execute_python.id
  http_method = aws_api_gateway_method.python_execute_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "python_execute_options" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.execute_python.id
  http_method = aws_api_gateway_method.python_execute_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "python_execute_options" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.execute_python.id
  http_method = aws_api_gateway_method.python_execute_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.python_execute_options]
}

# POST method for Python execution
resource "aws_api_gateway_method" "python_execute_post" {
  rest_api_id   = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id   = aws_api_gateway_resource.execute_python.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "python_execute_post" {
  rest_api_id             = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id             = aws_api_gateway_resource.execute_python.id
  http_method             = aws_api_gateway_method.python_execute_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.python_judge.invoke_arn
}

resource "aws_api_gateway_method_response" "python_execute_post" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.execute_python.id
  http_method = aws_api_gateway_method.python_execute_post.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

# JavaScript execute methods (similar pattern)
resource "aws_api_gateway_method" "javascript_execute_options" {
  rest_api_id   = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id   = aws_api_gateway_resource.execute_javascript.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "javascript_execute_options" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.execute_javascript.id
  http_method = aws_api_gateway_method.javascript_execute_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "javascript_execute_options" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.execute_javascript.id
  http_method = aws_api_gateway_method.javascript_execute_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "javascript_execute_options" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.execute_javascript.id
  http_method = aws_api_gateway_method.javascript_execute_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.javascript_execute_options]
}

resource "aws_api_gateway_method" "javascript_execute_post" {
  rest_api_id   = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id   = aws_api_gateway_resource.execute_javascript.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "javascript_execute_post" {
  rest_api_id             = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id             = aws_api_gateway_resource.execute_javascript.id
  http_method             = aws_api_gateway_method.javascript_execute_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.javascript_judge.invoke_arn
}

resource "aws_api_gateway_method_response" "javascript_execute_post" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.execute_javascript.id
  http_method = aws_api_gateway_method.javascript_execute_post.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

# SQL execute methods (similar pattern)
resource "aws_api_gateway_method" "sql_execute_options" {
  rest_api_id   = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id   = aws_api_gateway_resource.execute_sql.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "sql_execute_options" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.execute_sql.id
  http_method = aws_api_gateway_method.sql_execute_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "sql_execute_options" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.execute_sql.id
  http_method = aws_api_gateway_method.sql_execute_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "sql_execute_options" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.execute_sql.id
  http_method = aws_api_gateway_method.sql_execute_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.sql_execute_options, aws_api_gateway_method_response.sql_execute_options]
}

resource "aws_api_gateway_method" "sql_execute_post" {
  rest_api_id   = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id   = aws_api_gateway_resource.execute_sql.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "sql_execute_post" {
  rest_api_id             = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id             = aws_api_gateway_resource.execute_sql.id
  http_method             = aws_api_gateway_method.sql_execute_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.sql_judge.invoke_arn
}

resource "aws_api_gateway_method_response" "sql_execute_post" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.execute_sql.id
  http_method = aws_api_gateway_method.sql_execute_post.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

# ===== JAVA EXECUTION ENDPOINTS =====

# Options method for CORS pre-flight requests (Java)
resource "aws_api_gateway_method" "java_execute_options" {
  rest_api_id   = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id   = aws_api_gateway_resource.execute_java.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "java_execute_options" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.execute_java.id
  http_method = aws_api_gateway_method.java_execute_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "java_execute_options" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.execute_java.id
  http_method = aws_api_gateway_method.java_execute_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "java_execute_options" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.execute_java.id
  http_method = aws_api_gateway_method.java_execute_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.java_execute_options]
}

# POST method for Java execution
resource "aws_api_gateway_method" "java_execute_post" {
  rest_api_id   = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id   = aws_api_gateway_resource.execute_java.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "java_execute_post" {
  rest_api_id             = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id             = aws_api_gateway_resource.execute_java.id
  http_method             = aws_api_gateway_method.java_execute_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.java_executor.invoke_arn
}

resource "aws_api_gateway_method_response" "java_execute_post" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.execute_java.id
  http_method = aws_api_gateway_method.java_execute_post.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

# ===== C# EXECUTION ENDPOINTS =====

# Options method for CORS pre-flight requests (C#)
resource "aws_api_gateway_method" "csharp_execute_options" {
  rest_api_id   = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id   = aws_api_gateway_resource.execute_csharp.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "csharp_execute_options" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.execute_csharp.id
  http_method = aws_api_gateway_method.csharp_execute_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "csharp_execute_options" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.execute_csharp.id
  http_method = aws_api_gateway_method.csharp_execute_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "csharp_execute_options" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.execute_csharp.id
  http_method = aws_api_gateway_method.csharp_execute_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.csharp_execute_options]
}

# POST method for C# execution - Commented out until container image is built
# resource "aws_api_gateway_method" "csharp_execute_post" {
#   rest_api_id   = aws_api_gateway_rest_api.codecapsule_api.id
#   resource_id   = aws_api_gateway_resource.execute_csharp.id
#   http_method   = "POST"
#   authorization = "NONE"
# }
#
# resource "aws_api_gateway_integration" "csharp_execute_post" {
#   rest_api_id             = aws_api_gateway_rest_api.codecapsule_api.id
#   resource_id             = aws_api_gateway_resource.execute_csharp.id
#   http_method             = aws_api_gateway_method.csharp_execute_post.http_method
#   integration_http_method = "POST"
#   type                    = "AWS_PROXY"
#   uri                     = aws_lambda_function.csharp_executor.invoke_arn
# }
#
# resource "aws_api_gateway_method_response" "csharp_execute_post" {
#   rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
#   resource_id = aws_api_gateway_resource.execute_csharp.id
#   http_method = aws_api_gateway_method.csharp_execute_post.http_method
#   status_code = "200"
#
#   response_parameters = {
#     "method.response.header.Access-Control-Allow-Origin" = true
#   }
# }

# ===== GO EXECUTION ENDPOINTS =====

# Options method for CORS pre-flight requests (Go)
resource "aws_api_gateway_method" "go_execute_options" {
  rest_api_id   = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id   = aws_api_gateway_resource.execute_go.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "go_execute_options" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.execute_go.id
  http_method = aws_api_gateway_method.go_execute_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "go_execute_options" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.execute_go.id
  http_method = aws_api_gateway_method.go_execute_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "go_execute_options" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.execute_go.id
  http_method = aws_api_gateway_method.go_execute_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.go_execute_options]
}

# POST method for Go execution - Commented out until container image is built
# resource "aws_api_gateway_method" "go_execute_post" {
#   rest_api_id   = aws_api_gateway_rest_api.codecapsule_api.id
#   resource_id   = aws_api_gateway_resource.execute_go.id
#   http_method   = "POST"
#   authorization = "NONE"
# }
#
# resource "aws_api_gateway_integration" "go_execute_post" {
#   rest_api_id             = aws_api_gateway_rest_api.codecapsule_api.id
#   resource_id             = aws_api_gateway_resource.execute_go.id
#   http_method             = aws_api_gateway_method.go_execute_post.http_method
#   integration_http_method = "POST"
#   type                    = "AWS_PROXY"
#   uri                     = aws_lambda_function.go_executor.invoke_arn
# }
#
# resource "aws_api_gateway_method_response" "go_execute_post" {
#   rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
#   resource_id = aws_api_gateway_resource.execute_go.id
#   http_method = aws_api_gateway_method.go_execute_post.http_method
#   status_code = "200"
#
#   response_parameters = {
#     "method.response.header.Access-Control-Allow-Origin" = true
#   }
# }

# Health check method
resource "aws_api_gateway_method" "health_check_get" {
  rest_api_id   = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id   = aws_api_gateway_resource.health.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "health_check_get" {
  rest_api_id             = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id             = aws_api_gateway_resource.health.id
  http_method             = aws_api_gateway_method.health_check_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.health_check.invoke_arn
}

resource "aws_api_gateway_method_response" "health_check_get" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_check_get.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

# ===== LAMBDA PERMISSIONS =====

resource "aws_lambda_permission" "python_judge_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.python_judge.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.codecapsule_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "javascript_judge_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.javascript_judge.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.codecapsule_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "sql_judge_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.sql_judge.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.codecapsule_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "java_executor_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.java_executor.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.codecapsule_api.execution_arn}/*/*"
}

# Commented out until container images are built
# resource "aws_lambda_permission" "csharp_executor_api_gateway" {
#   statement_id  = "AllowAPIGatewayInvoke"
#   action        = "lambda:InvokeFunction"
#   function_name = aws_lambda_function.csharp_executor.function_name
#   principal     = "apigateway.amazonaws.com"
#   source_arn    = "${aws_api_gateway_rest_api.codecapsule_api.execution_arn}/*/*"
# }
#
# resource "aws_lambda_permission" "go_executor_api_gateway" {
#   statement_id  = "AllowAPIGatewayInvoke"
#   action        = "lambda:InvokeFunction"
#   function_name = aws_lambda_function.go_executor.function_name
#   principal     = "apigateway.amazonaws.com"
#   source_arn    = "${aws_api_gateway_rest_api.codecapsule_api.execution_arn}/*/*"
# }

resource "aws_lambda_permission" "health_check_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.health_check.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.codecapsule_api.execution_arn}/*/*"
}

# ===== HEALTH CHECK LAMBDA FUNCTION =====

# Create health check Lambda function
data "archive_file" "health_check_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda-zips/health-check.zip"
  
  source {
    content = <<EOF
import json

def lambda_handler(event, context):
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'status': 'healthy',
            'service': 'codecapsule-execution-engine',
            'version': '1.0.0',
            'timestamp': context.aws_request_id
        })
    }
EOF
    filename = "health-check.py"
  }
}

resource "aws_lambda_function" "health_check" {
  filename         = data.archive_file.health_check_zip.output_path
  function_name    = "${local.function_name_prefix}-health-check"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "health-check.lambda_handler"
  source_code_hash = data.archive_file.health_check_zip.output_base64sha256
  runtime         = "python3.11"
  timeout         = 10
  memory_size     = 128

  environment {
    variables = {
      LOG_LEVEL = "INFO"
    }
  }

  tracing_config {
    mode = "Active"
  }

  description = "CodeCapsule Health Check endpoint"

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_cloudwatch_log_group.health_check_log_group
  ]
}

# ===== SQL VALIDATOR ENDPOINTS (/validate/sql) =====

# OPTIONS method for CORS
resource "aws_api_gateway_method" "validate_sql_options" {
  rest_api_id   = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id   = aws_api_gateway_resource.validate_sql.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "validate_sql_options" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.validate_sql.id
  http_method = aws_api_gateway_method.validate_sql_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "validate_sql_options" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.validate_sql.id
  http_method = aws_api_gateway_method.validate_sql_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "validate_sql_options" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.validate_sql.id
  http_method = aws_api_gateway_method.validate_sql_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.validate_sql_options, aws_api_gateway_method_response.validate_sql_options]
}

# POST method for SQL validation
resource "aws_api_gateway_method" "validate_sql_post" {
  rest_api_id   = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id   = aws_api_gateway_resource.validate_sql.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "validate_sql_post" {
  rest_api_id             = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id             = aws_api_gateway_resource.validate_sql.id
  http_method             = aws_api_gateway_method.validate_sql_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.sql_validator.invoke_arn
}

resource "aws_api_gateway_method_response" "validate_sql_post" {
  rest_api_id = aws_api_gateway_rest_api.codecapsule_api.id
  resource_id = aws_api_gateway_resource.validate_sql.id
  http_method = aws_api_gateway_method.validate_sql_post.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

# Lambda permission for API Gateway to invoke SQL validator
resource "aws_lambda_permission" "api_gateway_invoke_sql_validator" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.sql_validator.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.codecapsule_api.execution_arn}/*/*"
}

# Note: Outputs are defined in outputs.tf