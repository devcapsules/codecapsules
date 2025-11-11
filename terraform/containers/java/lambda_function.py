import json
import os
import subprocess
import tempfile
import time
import signal
import threading
from pathlib import Path

def lambda_handler(event, context):
    """
    AWS Lambda handler for Java code compilation and execution
    """
    try:
        # Parse the incoming event (API Gateway format)
        if 'body' in event:
            if isinstance(event['body'], str):
                body = json.loads(event['body'])
            else:
                body = event['body']
        else:
            body = event
            
        # Extract parameters
        code = body.get('code', '')
        test_input = body.get('testInput', '')
        timeout_seconds = min(int(body.get('timeout', 25)), 25)  # Max 25 seconds
        
        if not code.strip():
            return create_response(False, '', 'No code provided', 400)
            
        # Execute Java code
        result = execute_java_code(code, test_input, timeout_seconds)
        
        return create_response(
            result['success'],
            result['stdout'],
            result.get('stderr', ''),
            200 if result['success'] else 400
        )
        
    except Exception as e:
        return create_response(False, '', f'Lambda handler error: {str(e)}', 500)

def execute_java_code(code, test_input='', timeout_seconds=25):
    """
    Compile and execute Java code with timeout and resource limits
    """
    workspace = '/tmp/workspace'
    
    # Ensure workspace directory exists
    os.makedirs(workspace, exist_ok=True)
    
    try:
        # Clean workspace
        subprocess.run(['rm', '-rf', f'{workspace}/*'], shell=True, check=False)
        
        # Extract class name from code
        class_name = extract_class_name(code)
        if not class_name:
            return {
                'success': False,
                'stdout': '',
                'stderr': 'Could not find public class declaration. Please ensure your code has a public class with a main method.'
            }
        
        # Write Java source file
        java_file = f'{workspace}/{class_name}.java'
        with open(java_file, 'w') as f:
            f.write(code)
        
        # Compile Java code
        compile_result = subprocess.run(
            ['javac', java_file],
            cwd=workspace,
            capture_output=True,
            text=True,
            timeout=10  # Compilation timeout
        )
        
        if compile_result.returncode != 0:
            return {
                'success': False,
                'stdout': '',
                'stderr': f'Compilation error:\n{compile_result.stderr}'
            }
        
        # Execute Java code with timeout
        return execute_with_timeout(class_name, test_input, workspace, timeout_seconds)
        
    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'stdout': '',
            'stderr': 'Compilation timeout (10 seconds exceeded)'
        }
    except Exception as e:
        return {
            'success': False,
            'stdout': '',
            'stderr': f'Execution error: {str(e)}'
        }

def extract_class_name(code):
    """
    Extract the public class name from Java code
    """
    import re
    
    # Look for public class declaration
    pattern = r'public\s+class\s+(\w+)'
    match = re.search(pattern, code)
    
    if match:
        return match.group(1)
    
    # Fallback: look for any class declaration
    pattern = r'class\s+(\w+)'
    match = re.search(pattern, code)
    
    if match:
        return match.group(1)
        
    return None

def execute_with_timeout(class_name, test_input, workspace, timeout_seconds):
    """
    Execute Java program with timeout using threading
    """
    result = {'success': False, 'stdout': '', 'stderr': '', 'timeout': False}
    
    def run_java():
        try:
            # Run Java program
            process = subprocess.run(
                ['java', class_name],
                cwd=workspace,
                input=test_input,
                capture_output=True,
                text=True,
                timeout=timeout_seconds
            )
            
            result['returncode'] = process.returncode
            result['stdout'] = process.stdout
            result['stderr'] = process.stderr
            result['success'] = process.returncode == 0
            
        except subprocess.TimeoutExpired:
            result['timeout'] = True
            result['stderr'] = f'Execution timeout ({timeout_seconds} seconds exceeded)'
        except Exception as e:
            result['stderr'] = f'Runtime error: {str(e)}'
    
    # Run in thread with timeout
    thread = threading.Thread(target=run_java)
    thread.daemon = True
    thread.start()
    thread.join(timeout_seconds + 1)  # Extra second for cleanup
    
    if thread.is_alive():
        result['timeout'] = True
        result['stderr'] = f'Execution timeout ({timeout_seconds} seconds exceeded)'
    
    return result

def create_response(success, stdout, stderr, status_code):
    """
    Create standardized API Gateway response
    """
    response_body = {
        'success': success,
        'stdout': stdout,
        'execution': {
            'stdout': stdout,
            'stderr': stderr
        }
    }
    
    if stderr and not success:
        response_body['error'] = stderr
    
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        'body': json.dumps(response_body)
    }

# Test function for local development
if __name__ == '__main__':
    # Test with sample Java code
    test_event = {
        'body': json.dumps({
            'code': '''
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello from Java Lambda!");
        System.out.println("Args length: " + args.length);
        
        // Test input reading
        java.util.Scanner scanner = new java.util.Scanner(System.in);
        if (scanner.hasNextLine()) {
            String input = scanner.nextLine();
            System.out.println("Input received: " + input);
        }
    }
}
            ''',
            'testInput': 'Test input data',
            'timeout': 10
        })
    }
    
    result = lambda_handler(test_event, None)
    print("Test Result:")
    print(json.dumps(json.loads(result['body']), indent=2))