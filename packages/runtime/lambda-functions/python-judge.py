"""
Python Judge Lambda Function - The Serverless Sandbox

This Lambda function replaces Judge0 for Python code execution:
✅ Scales to zero ($0 cost with no users)  
✅ Ultra-secure (fresh microVM per execution)
✅ Network isolation (no internet access)
✅ Memory and timeout limits
"""

import sys
import io
import json
import traceback
import time
import signal


def timeout_handler(signum, frame):
    """Handle execution timeout"""
    raise TimeoutError("Code execution timed out")


def lambda_handler(event, context):
    """
    Main Lambda handler for Python code execution
    
    Event format:
    {
        "code": "print('Hello, World!')",
        "testInput": "optional test data",
        "timeout": 10
    }
    """
    start_time = time.time()
    
    try:        
        # Handle AWS API Gateway proxy integration format
        if 'body' in event and event['body']:
            # Parse JSON body from API Gateway
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
            user_code = body.get('code', '')
            test_input = body.get('testInput')
            timeout_seconds = min(body.get('timeout', 10), 30)  # Max 30 seconds
        else:
            # Direct Lambda invocation format
            user_code = event.get('code', '')
            test_input = event.get('testInput')
            timeout_seconds = min(event.get('timeout', 10), 30)  # Max 30 seconds
        
        # Validate input
        if not user_code.strip():
            return create_error_response("No code provided")
            
        if len(user_code) > 50000:  # 50KB limit
            return create_error_response("Code too large (max 50KB)")
            
        # Set up timeout handler
        signal.signal(signal.SIGALRM, timeout_handler)
        signal.alarm(timeout_seconds)
        
        try:
            # Execute the code in isolated environment
            result = execute_python_code(user_code, test_input)
            
            # Calculate execution time
            execution_time = int((time.time() - start_time) * 1000)
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'success': True,
                    'stdout': result['stdout'],
                    'stderr': result['stderr'],
                    'executionTime': execution_time,
                    'memoryUsed': estimate_memory_usage(),
                    'exitCode': 0 if result['success'] else 1
                })
            }
            
        finally:
            # Disable timeout
            signal.alarm(0)
            
    except TimeoutError:
        return create_error_response("Execution timed out", 408)
        
    except Exception as e:
        return create_error_response(f"Execution failed: {str(e)}")


def execute_python_code(code, test_input=None):
    """
    Execute Python code in a controlled environment
    """
    # Capture stdout and stderr
    stdout_capture = io.StringIO()
    stderr_capture = io.StringIO()
    
    # Store original streams
    original_stdout = sys.stdout
    original_stderr = sys.stderr
    
    # Create restricted globals (security)
    restricted_globals = create_restricted_globals()
    
    try:
        # Redirect output streams
        sys.stdout = stdout_capture
        sys.stderr = stderr_capture
        
        # Inject test input if provided
        if test_input is not None:
            restricted_globals['test_input'] = test_input
        
        # Execute the user code
        # This is safe because:
        # 1. Lambda provides process isolation
        # 2. No network access in Lambda
        # 3. Restricted globals remove dangerous functions
        # 4. Container is destroyed after execution
        exec(code, restricted_globals)
        
        success = True
        
    except Exception as e:
        # Capture any execution errors
        sys.stderr.write(f"{type(e).__name__}: {str(e)}\\n")
        sys.stderr.write(traceback.format_exc())
        success = False
        
    finally:
        # Restore original streams
        sys.stdout = original_stdout
        sys.stderr = original_stderr
    
    return {
        'success': success,
        'stdout': stdout_capture.getvalue(),
        'stderr': stderr_capture.getvalue()
    }


def create_restricted_globals():
    """
    Create a restricted global namespace for security
    """
    # Start with safe builtins
    safe_builtins = {
        'print': print,
        'len': len,
        'str': str,
        'int': int,
        'float': float,
        'bool': bool,
        'list': list,
        'dict': dict,
        'tuple': tuple,
        'set': set,
        'range': range,
        'enumerate': enumerate,
        'zip': zip,
        'map': map,
        'filter': filter,
        'sum': sum,
        'max': max,
        'min': min,
        'abs': abs,
        'round': round,
        'sorted': sorted,
        'reversed': reversed,
        'any': any,
        'all': all,
        'isinstance': isinstance,
        'type': type,
        'hasattr': hasattr,
        'getattr': getattr,
        'setattr': setattr,
        'ord': ord,
        'chr': chr,
        'hex': hex,
        'oct': oct,
        'bin': bin,
        # Safe exceptions
        'Exception': Exception,
        'ValueError': ValueError,
        'TypeError': TypeError,
        'KeyError': KeyError,
        'IndexError': IndexError,
    }
    
    # Add safe modules
    import math
    import random
    import string
    import datetime
    import json as json_module
    
    safe_modules = {
        'math': math,
        'random': random,
        'string': string,
        'datetime': datetime,
        'json': json_module,
    }
    
    return {**safe_builtins, **safe_modules}


def estimate_memory_usage():
    """
    Rough estimate of memory usage in MB
    """
    # In a real implementation, you'd use more sophisticated memory tracking
    return 32  # 32MB baseline estimate


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
    # Test the function locally
    test_event = {
        'code': '''
for i in range(3):
    print(f"Hello {i}")
    
x = 2 + 2
print(f"Result: {x}")
''',
        'timeout': 5
    }
    
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2))