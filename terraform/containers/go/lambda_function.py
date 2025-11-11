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
    AWS Lambda handler for Go code compilation and execution
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
            
        # Execute Go code
        result = execute_go_code(code, test_input, timeout_seconds)
        
        return create_response(
            result['success'],
            result['stdout'],
            result.get('stderr', ''),
            200 if result['success'] else 400
        )
        
    except Exception as e:
        return create_response(False, '', f'Lambda handler error: {str(e)}', 500)

def execute_go_code(code, test_input='', timeout_seconds=25):
    """
    Compile and execute Go code with timeout and resource limits
    """
    workspace = '/tmp/workspace'
    
    # Ensure workspace directory exists
    os.makedirs(workspace, exist_ok=True)
    
    try:
        # Clean workspace
        subprocess.run(['rm', '-rf', f'{workspace}/*'], shell=True, check=False)
        
        # Initialize Go module
        subprocess.run(['go', 'mod', 'init', 'execution'], cwd=workspace, check=False)
        
        # Write Go source file
        go_file = f'{workspace}/main.go'
        
        # Wrap code if it doesn't contain a main function
        if 'func main()' not in code:
            wrapped_code = f'''package main

import (
    "fmt"
    "bufio"
    "os"
    "strings"
)

func main() {{
{indent_code(code, 4)}
}}'''
        else:
            # Ensure package main is present
            if 'package main' not in code:
                wrapped_code = f'package main\n\n{code}'
            else:
                wrapped_code = code
                
        with open(go_file, 'w') as f:
            f.write(wrapped_code)
        
        # Compile Go code
        compile_result = subprocess.run(
            ['go', 'build', '-o', 'main', 'main.go'],
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
        
        # Execute Go code with timeout
        return execute_with_timeout(workspace, test_input, timeout_seconds)
        
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

def indent_code(code, spaces):
    """
    Indent each line of code by the specified number of spaces
    """
    return '\n'.join(' ' * spaces + line if line.strip() else line for line in code.split('\n'))

def execute_with_timeout(workspace, test_input, timeout_seconds):
    """
    Execute Go program with timeout using threading
    """
    result = {'success': False, 'stdout': '', 'stderr': '', 'timeout': False}
    
    def run_go():
        try:
            # Run Go program
            process = subprocess.run(
                ['./main'],
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
    thread = threading.Thread(target=run_go)
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
    # Test with sample Go code
    test_event = {
        'body': json.dumps({
            'code': '''
fmt.Println("Hello from Go Lambda!")
fmt.Printf("Current working directory: %s\\n", "/tmp/workspace")

// Test input reading
scanner := bufio.NewScanner(os.Stdin)
if scanner.Scan() {
    input := scanner.Text()
    if strings.TrimSpace(input) != "" {
        fmt.Printf("Input received: %s\\n", input)
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