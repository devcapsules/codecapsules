"""
SQL Judge Lambda Function - API Gateway Test Version

This is a simplified version for testing API Gateway event parsing
without requiring database connection.
"""

import json
import time


def lambda_handler(event, context):
    """
    Main Lambda handler for SQL query execution (test version)
    """
    start_time = time.time()
    
    try:
        # Handle API Gateway events (body is a JSON string)
        if 'body' in event and isinstance(event['body'], str):
            try:
                body = json.loads(event['body'])
                user_sql = body.get('code', '').strip()  # Changed from 'source_code' to 'code'
                language = body.get('language', 'sql')
                timeout_seconds = min(body.get('timeout', 30), 60)
            except json.JSONDecodeError as e:
                return create_error_response(f"Invalid JSON in request body: {str(e)}")
        else:
            # Handle direct Lambda invocation
            user_sql = event.get('code', '').strip()  # Changed from 'sql' to 'code'
            language = event.get('language', 'sql')
            timeout_seconds = min(event.get('timeout', 30), 60)
        
        # Validate input
        if not user_sql:
            return create_error_response("No SQL query provided")
            
        # Calculate execution time
        execution_time = int((time.time() - start_time) * 1000)
        
        # Mock successful SQL execution
        mock_result = [{"result": 2}] if "1 + 1" in user_sql else [{"status": "SQL parsing successful", "query": user_sql[:50] + "..."}]
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({
                'success': True,
                'stdout': json.dumps(mock_result, indent=2),
                'stderr': '',
                'executionTime': execution_time,
                'memoryUsed': 24,
                'exitCode': 0,
                'message': f'SQL Lambda working! Parsed {language} query successfully.'
            })
        }
            
    except Exception as e:
        return create_error_response(f"Query execution failed: {str(e)}")


def create_error_response(message, status_code=400):
    """Create standardized error response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        'body': json.dumps({
            'success': False,
            'stdout': '',
            'stderr': message,
            'executionTime': 0,
            'memoryUsed': 0,
            'exitCode': 1,
            'error': message
        })
    }


# For local testing
if __name__ == '__main__':
    test_event = {
        'body': '{"source_code": "SELECT 1 + 1 as result;", "language": "sql", "input": ""}'
    }
    
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2))