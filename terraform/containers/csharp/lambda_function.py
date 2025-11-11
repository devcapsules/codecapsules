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
    AWS Lambda handler for C# code compilation and execution
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
            
        # Execute C# code
        result = execute_csharp_code(code, test_input, timeout_seconds)
        
        return create_response(
            result['success'],
            result['stdout'],
            result.get('stderr', ''),
            200 if result['success'] else 400
        )
        
    except Exception as e:
        return create_response(False, '', f'Lambda handler error: {str(e)}', 500)

def execute_csharp_code(code, test_input='', timeout_seconds=25):
    """
    Compile and execute C# code with timeout and resource limits
    """
    workspace = '/tmp/workspace'
    
    # Ensure workspace directory exists
    os.makedirs(workspace, exist_ok=True)
    
    try:
        # Clean workspace
        subprocess.run(['rm', '-rf', f'{workspace}/*'], shell=True, check=False)
        
        # Create project structure
        project_name = 'CSharpExecution'
        project_dir = f'{workspace}/{project_name}'
        os.makedirs(project_dir, exist_ok=True)
        
        # Create project file
        csproj_content = '''<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>'''
        
        with open(f'{project_dir}/{project_name}.csproj', 'w') as f:
            f.write(csproj_content)
        
        # Write C# source file
        cs_file = f'{project_dir}/Program.cs'
        
        # Wrap code if it doesn't contain a Main method
        if 'static void Main' not in code and 'static async Task Main' not in code:
            wrapped_code = f'''using System;
using System.Threading.Tasks;

class Program 
{{
    static void Main(string[] args)
    {{
{indent_code(code, 8)}
    }}
}}'''
        else:
            wrapped_code = code
            
        with open(cs_file, 'w') as f:
            f.write(wrapped_code)
        
        # Compile C# code
        compile_result = subprocess.run(
            ['dotnet', 'build', '--configuration', 'Release'],
            cwd=project_dir,
            capture_output=True,
            text=True,
            timeout=15  # Compilation timeout
        )
        
        if compile_result.returncode != 0:
            return {
                'success': False,
                'stdout': '',
                'stderr': f'Compilation error:\n{compile_result.stderr}'
            }
        
        # Execute C# code with timeout
        return execute_with_timeout(project_dir, project_name, test_input, timeout_seconds)
        
    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'stdout': '',
            'stderr': 'Compilation timeout (15 seconds exceeded)'
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

def execute_with_timeout(project_dir, project_name, test_input, timeout_seconds):
    """
    Execute C# program with timeout using threading
    """
    result = {'success': False, 'stdout': '', 'stderr': '', 'timeout': False}
    
    def run_csharp():
        try:
            # Run C# program
            exe_path = f'bin/Release/net8.0/{project_name}'
            process = subprocess.run(
                ['dotnet', exe_path],
                cwd=project_dir,
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
    thread = threading.Thread(target=run_csharp)
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
    # Test with sample C# code
    test_event = {
        'body': json.dumps({
            'code': '''
Console.WriteLine("Hello from C# Lambda!");
Console.WriteLine($"Current time: {DateTime.Now}");

// Test input reading
string input = Console.ReadLine();
if (!string.IsNullOrEmpty(input))
{
    Console.WriteLine($"Input received: {input}");
}
            ''',
            'testInput': 'Test input data',
            'timeout': 10
        })
    }
    
    result = lambda_handler(test_event, None)
    print("Test Result:")
    print(json.dumps(json.loads(result['body']), indent=2))