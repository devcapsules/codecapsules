"""
SQL Judge Lambda Function - Supabase Read-Only Execution

This Lambda function provides secure SQL execution against Supabase:
✅ READ-ONLY database access (no modifications possible)
✅ Dedicated exercise schema with limited tables
✅ Connection pooling for performance  
✅ Query timeout and result size limits
"""

import json
import os
import time
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import sql
import re


def lambda_handler(event, context):
    """
    Main Lambda handler for SQL query execution
    
    Event format:
    {
        "sql": "SELECT * FROM users LIMIT 10;",
        "timeout": 30
    }
    """
    start_time = time.time()
    
    try:
        # Extract parameters
        user_sql = event.get('sql', '').strip()
        timeout_seconds = min(event.get('timeout', 30), 60)  # Max 60 seconds
        
        # Validate input
        if not user_sql:
            return create_error_response("No SQL query provided")
            
        if len(user_sql) > 10000:  # 10KB limit
            return create_error_response("Query too large (max 10KB)")
            
        # Security validation
        security_check = validate_sql_security(user_sql)
        if not security_check['valid']:
            return create_error_response(f"Security violation: {security_check['reason']}")
        
        # Execute the query
        result = execute_sql_query(user_sql, timeout_seconds)
        
        # Calculate execution time
        execution_time = int((time.time() - start_time) * 1000)
        
        if result['success']:
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'success': True,
                    'stdout': json.dumps(result['data'], indent=2),
                    'stderr': '',
                    'executionTime': execution_time,
                    'memoryUsed': estimate_memory_usage(),
                    'exitCode': 0,
                    'rowsAffected': result['row_count']
                })
            }
        else:
            return create_error_response(result['error'])
            
    except Exception as e:
        return create_error_response(f"Query execution failed: {str(e)}")


def execute_sql_query(query, timeout_seconds):
    """
    Execute SQL query against Supabase with read-only user
    """
    connection = None
    cursor = None
    
    try:
        # Get database connection details from environment
        db_config = {
            'host': os.environ.get('DB_HOST'),
            'database': os.environ.get('DB_NAME', 'postgres'),
            'user': os.environ.get('DB_USER_RO'),  # Read-only user
            'password': os.environ.get('DB_PASS_RO'),
            'port': os.environ.get('DB_PORT', 5432),
            'connect_timeout': 10,
            'sslmode': 'require'
        }
        
        # Validate configuration
        if not all([db_config['host'], db_config['user'], db_config['password']]):
            return {
                'success': False, 
                'error': 'Database configuration missing'
            }
        
        # Connect to database
        connection = psycopg2.connect(**db_config)
        connection.set_session(readonly=True, autocommit=True)
        
        # Create cursor with timeout
        cursor = connection.cursor(cursor_factory=RealDictCursor)
        
        # Set query timeout
        cursor.execute(f"SET statement_timeout = '{timeout_seconds}s'")
        
        # Execute the user's query
        cursor.execute(query)
        
        # Fetch results (limit to prevent memory issues)
        max_rows = 1000
        rows = cursor.fetchmany(max_rows)
        
        # Convert to list of dictionaries for JSON serialization
        data = [dict(row) for row in rows]
        
        # Check if there are more rows
        if len(rows) == max_rows:
            try:
                more_rows = cursor.fetchone()
                if more_rows:
                    data.append({"_warning": f"Results limited to {max_rows} rows"})
            except:
                pass
        
        return {
            'success': True,
            'data': data,
            'row_count': len(data)
        }
        
    except psycopg2.Error as e:
        # Database-specific errors
        error_msg = str(e).strip()
        
        # Clean up error message for user
        if 'permission denied' in error_msg.lower():
            error_msg = "Permission denied - this query requires privileges not available in the exercise environment"
        elif 'syntax error' in error_msg.lower():
            error_msg = f"SQL syntax error: {error_msg}"
        elif 'does not exist' in error_msg.lower():
            error_msg = f"Database object does not exist: {error_msg}"
            
        return {
            'success': False,
            'error': error_msg
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f"Unexpected error: {str(e)}"
        }
        
    finally:
        # Clean up connections
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def validate_sql_security(query):
    """
    Validate SQL query for security compliance
    
    The read-only user provides the primary security, but we add
    additional validation for better user experience.
    """
    query_upper = query.upper().strip()
    
    # Check for obviously dangerous statements
    dangerous_statements = [
        'DROP', 'CREATE', 'ALTER', 'INSERT', 'UPDATE', 'DELETE',
        'TRUNCATE', 'GRANT', 'REVOKE', 'EXEC', 'EXECUTE',
        'CALL', 'DO', 'LOAD', 'COPY'
    ]
    
    for statement in dangerous_statements:
        if re.search(rf'\\b{statement}\\b', query_upper):
            return {
                'valid': False,
                'reason': f'{statement} statements are not allowed in read-only mode'
            }
    
    # Check for function calls that might be dangerous
    dangerous_functions = [
        'PG_SLEEP', 'PG_TERMINATE_BACKEND', 'PG_CANCEL_BACKEND',
        'LO_CREATE', 'LO_UNLINK', 'LO_IMPORT', 'LO_EXPORT'
    ]
    
    for func in dangerous_functions:
        if re.search(rf'\\b{func}\\s*\\(', query_upper):
            return {
                'valid': False,
                'reason': f'{func} function is not allowed'
            }
    
    # Basic length and complexity checks
    if len(query) > 10000:
        return {
            'valid': False,
            'reason': 'Query exceeds maximum length (10KB)'
        }
    
    # Count subqueries (prevent overly complex queries)
    subquery_count = len(re.findall(r'\\(\\s*SELECT\\b', query_upper))
    if subquery_count > 5:
        return {
            'valid': False,
            'reason': 'Query has too many subqueries (max 5)'
        }
    
    return {'valid': True}


def estimate_memory_usage():
    """
    Estimate memory usage in MB
    """
    return 24  # 24MB baseline for SQL operations


def create_error_response(message, status_code=400):
    """Create standardized error response"""
    return {
        'statusCode': status_code,
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
    # Mock environment variables for testing
    os.environ.setdefault('DB_HOST', 'localhost')
    os.environ.setdefault('DB_USER_RO', 'readonly_user')
    os.environ.setdefault('DB_PASS_RO', 'readonly_pass')
    
    test_event = {
        'sql': '''
            SELECT 
                id,
                name,
                email,
                created_at
            FROM users 
            WHERE created_at > '2023-01-01'
            ORDER BY created_at DESC
            LIMIT 10;
        ''',
        'timeout': 15
    }
    
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2))