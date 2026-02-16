/**
 * AWS Lambda Handler for Heavy Language Execution
 * 
 * Executes Java, C++, and C code using native compilers.
 * This is Tier 2 execution (Lambda) for heavy languages.
 */

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { exec, spawn } from 'child_process';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { promisify } from 'util';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);

interface ExecutionRequest {
  language: 'java' | 'cpp' | 'c';
  source_code: string;
  input?: string;
  time_limit?: number;
  memory_limit?: number;
}

interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exit_code: number;
  execution_time: number;
  compilation_time?: number;
}

// Language configurations
const LANGUAGE_CONFIG = {
  java: {
    extension: '.java',
    compile: (file: string, dir: string) => `javac -d ${dir} ${file}`,
    run: (className: string, dir: string) => `java -cp ${dir} ${className}`,
    getClassName: (code: string) => {
      const match = code.match(/public\s+class\s+(\w+)/);
      return match ? match[1] : 'Main';
    },
  },
  cpp: {
    extension: '.cpp',
    compile: (file: string, dir: string) => `g++ -O2 -o ${dir}/a.out ${file}`,
    run: (_: string, dir: string) => `${dir}/a.out`,
    getClassName: () => 'main',
  },
  c: {
    extension: '.c',
    compile: (file: string, dir: string) => `gcc -O2 -o ${dir}/a.out ${file}`,
    run: (_: string, dir: string) => `${dir}/a.out`,
    getClassName: () => 'main',
  },
};

/**
 * Lambda handler
 */
export async function execute(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  };

  // Handle OPTIONS
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Validate API key
  const apiKey = event.headers?.['x-api-key'] || event.headers?.['X-API-Key'];
  if (apiKey !== process.env.API_KEY) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  const startTime = Date.now();

  try {
    const body: ExecutionRequest = JSON.parse(event.body || '{}');
    const { language, source_code, input = '', time_limit = 10 } = body;

    // Validate
    if (!language || !source_code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'language and source_code are required' }),
      };
    }

    if (!LANGUAGE_CONFIG[language]) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Unsupported language: ${language}` }),
      };
    }

    // Execute
    const result = await executeCode(language, source_code, input, time_limit);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...result,
        execution_time: Date.now() - startTime,
      }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Execution failed',
        exit_code: 1,
        execution_time: Date.now() - startTime,
      }),
    };
  }
}

/**
 * Execute code with compilation and runtime
 */
async function executeCode(
  language: 'java' | 'cpp' | 'c',
  code: string,
  input: string,
  timeLimit: number
): Promise<ExecutionResult> {
  const config = LANGUAGE_CONFIG[language];
  const execId = randomUUID().slice(0, 8);
  const workDir = `/tmp/executions/${execId}`;
  const className = config.getClassName(code);
  const sourceFile = join(workDir, `${className}${config.extension}`);

  try {
    // Create work directory
    await mkdir(workDir, { recursive: true });

    // Write source file
    await writeFile(sourceFile, code);

    // ════════════════════════════════════════════════════════════════════════
    // Compilation
    // ════════════════════════════════════════════════════════════════════════
    const compileStart = Date.now();
    const compileCmd = config.compile(sourceFile, workDir);

    try {
      await execAsync(compileCmd, {
        timeout: 30000, // 30s compile timeout
        cwd: workDir,
      });
    } catch (compileError: any) {
      return {
        success: false,
        stdout: '',
        stderr: `Compilation Error:\n${compileError.stderr || compileError.message}`,
        exit_code: 1,
        compilation_time: Date.now() - compileStart,
      };
    }

    const compilationTime = Date.now() - compileStart;

    // ════════════════════════════════════════════════════════════════════════
    // Execution
    // ════════════════════════════════════════════════════════════════════════
    const runCmd = config.run(className, workDir);
    const result = await runWithTimeout(runCmd, input, timeLimit * 1000, workDir);

    return {
      ...result,
      compilation_time: compilationTime,
    };

  } finally {
    // Cleanup
    try {
      await execAsync(`rm -rf ${workDir}`);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Run command with timeout and input
 */
function runWithTimeout(
  command: string,
  input: string,
  timeoutMs: number,
  cwd: string
): Promise<Omit<ExecutionResult, 'compilation_time'>> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let killed = false;

    const parts = command.split(' ');
    const proc = spawn(parts[0], parts.slice(1), {
      cwd,
      timeout: timeoutMs,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Timeout handler
    const timeoutId = setTimeout(() => {
      killed = true;
      proc.kill('SIGKILL');
    }, timeoutMs);

    // Write input
    if (input) {
      proc.stdin.write(input);
    }
    proc.stdin.end();

    // Capture output
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      // Limit output size
      if (stdout.length > 100000) {
        killed = true;
        proc.kill('SIGKILL');
      }
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Handle completion
    proc.on('close', (code, signal) => {
      clearTimeout(timeoutId);

      if (killed || signal === 'SIGKILL') {
        resolve({
          success: false,
          stdout: stdout.slice(0, 10000),
          stderr: 'Time Limit Exceeded (TLE)',
          exit_code: 124,
          execution_time: Date.now() - startTime,
        });
        return;
      }

      resolve({
        success: code === 0,
        stdout: stdout.trim().slice(0, 50000),
        stderr: stderr.trim().slice(0, 10000),
        exit_code: code ?? 1,
        execution_time: Date.now() - startTime,
      });
    });

    proc.on('error', (error) => {
      clearTimeout(timeoutId);
      resolve({
        success: false,
        stdout: '',
        stderr: error.message,
        exit_code: 1,
        execution_time: Date.now() - startTime,
      });
    });
  });
}
