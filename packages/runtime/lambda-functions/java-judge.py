import json
import sys
import os
import traceback
import subprocess
import tempfile
from pathlib import Path

def lambda_handler(event, context):
    """
    Java Judge Lambda Function
    
    Compiles and executes Java code in a secure container environment.
    Supports both single-class and multi-class Java programs.
    """
    try:
        # Parse input
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event
        
        source_code = body.get('source_code', '').strip()
        input_data = body.get('input', '')
        time_limit = min(body.get('time_limit', 10), 30)  # Max 30 seconds
        memory_limit = min(body.get('memory_limit', 128), 512)  # Max 512MB
        
        if not source_code:
            return create_response(400, "No source code provided")
        
        # Create temporary directory for compilation and execution
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Determine main class name
            main_class = extract_main_class(source_code)
            if not main_class:
                return create_response(400, "No public class with main method found")
            
            java_file = temp_path / f"{main_class}.java"
            class_file = temp_path / f"{main_class}.class"
            
            # Write source code to file
            with open(java_file, 'w', encoding='utf-8') as f:
                f.write(source_code)
            
            # Compile Java code
            compile_result = compile_java(java_file, temp_path, time_limit)
            if not compile_result['success']:
                return create_response(400, compile_result['error'], compile_output=compile_result['output'])
            
            # Execute compiled Java program
            execution_result = execute_java(main_class, temp_path, input_data, time_limit, memory_limit)
            
            return create_response(
                200,
                "Execution completed",
                stdout=execution_result['stdout'],
                stderr=execution_result['stderr'],
                execution_time=execution_result['time'],
                memory_used=execution_result['memory'],
                exit_code=execution_result['exit_code']
            )
            
    except Exception as e:
        error_details = traceback.format_exc()
        return create_response(500, f"Internal server error: {str(e)}", error_details=error_details)

def extract_main_class(source_code):
    """Extract the name of the public class containing the main method"""
    lines = source_code.split('\n')
    
    for line in lines:
        line = line.strip()
        # Look for public class declaration
        if line.startswith('public class '):
            # Extract class name
            parts = line.split()
            if len(parts) >= 3:
                class_name = parts[2]
                # Remove any braces or implements/extends clauses
                class_name = class_name.split('{')[0].split(' ')[0]
                
                # Check if this class has a main method
                if 'public static void main' in source_code:
                    return class_name
    
    return None

def compile_java(java_file, working_dir, time_limit):
    """Compile Java source code using javac"""
    try:
        # Use javac to compile
        compile_cmd = [
            'javac',
            '-cp', str(working_dir),  # Set classpath to working directory
            str(java_file)
        ]
        
        # Run compilation with timeout
        process = subprocess.run(
            compile_cmd,
            cwd=working_dir,
            capture_output=True,
            text=True,
            timeout=time_limit,
            env={**os.environ, 'JAVA_HOME': '/opt/java/openjdk'}
        )
        
        if process.returncode == 0:
            return {
                'success': True,
                'output': process.stdout,
                'error': None
            }
        else:
            return {
                'success': False,
                'output': process.stdout + process.stderr,
                'error': 'Compilation failed'
            }
            
    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'output': '',
            'error': f'Compilation timeout ({time_limit}s)'
        }
    except Exception as e:
        return {
            'success': False,
            'output': '',
            'error': f'Compilation error: {str(e)}'
        }

def execute_java(main_class, working_dir, input_data, time_limit, memory_limit):
    """Execute compiled Java program"""
    start_time = time.time()
    
    try:
        # Construct java execution command with security restrictions
        java_cmd = [
            'java',
            f'-Xmx{memory_limit}m',  # Set maximum heap size
            '-Xms32m',  # Set initial heap size
            '-cp', str(working_dir),  # Set classpath
            # Security restrictions
            '-Djava.security.policy=/opt/java.policy',  # Custom security policy
            '-Djava.awt.headless=true',  # Disable GUI
            '-Dfile.encoding=UTF-8',
            main_class
        ]
        
        # Execute with timeout and input
        process = subprocess.run(
            java_cmd,
            cwd=working_dir,
            input=input_data,
            capture_output=True,
            text=True,
            timeout=time_limit,
            env={**os.environ, 'JAVA_HOME': '/opt/java/openjdk'}
        )
        
        execution_time = time.time() - start_time
        
        return {
            'stdout': process.stdout,
            'stderr': process.stderr,
            'exit_code': process.returncode,
            'time': execution_time,
            'memory': estimate_memory_usage(process)
        }
        
    except subprocess.TimeoutExpired:
        execution_time = time.time() - start_time
        return {
            'stdout': '',
            'stderr': f'Time limit exceeded ({time_limit}s)',
            'exit_code': 124,  # Timeout exit code
            'time': execution_time,
            'memory': 0
        }
    except Exception as e:
        execution_time = time.time() - start_time
        return {
            'stdout': '',
            'stderr': f'Runtime error: {str(e)}',
            'exit_code': 1,
            'time': execution_time,
            'memory': 0
        }

def estimate_memory_usage(process):
    """Estimate memory usage (simplified for container environment)"""
    try:
        # In a real container, you'd use cgroups or process monitoring
        # This is a simplified estimation
        return 64  # Return estimated MB usage
    except:
        return 0

def create_response(status_code, message, **kwargs):
    """Create standardized Lambda response"""
    response_body = {
        'message': message,
        'timestamp': int(time.time()),
        **kwargs
    }
    
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(response_body)
    }

# For local testing
if __name__ == '__main__':
    import time
    
    test_event = {
        'body': json.dumps({
            'source_code': '''
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        // Read input
        java.util.Scanner scanner = new java.util.Scanner(System.in);
        if (scanner.hasNextLine()) {
            String input = scanner.nextLine();
            System.out.println("You entered: " + input);
        }
        scanner.close();
    }
}
            '''.strip(),
            'input': 'Test input',
            'time_limit': 10,
            'memory_limit': 128
        })
    }
    
    result = lambda_handler(test_event, None)
    print(json.dumps(json.loads(result['body']), indent=2))