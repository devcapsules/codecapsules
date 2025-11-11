/**
 * JavaScript Judge Lambda Function - Node.js Serverless Sandbox
 * 
 * This Lambda function replaces Judge0 for JavaScript code execution:
 * ✅ Scales to zero ($0 cost with no users)  
 * ✅ Ultra-secure (fresh microVM per execution)
 * ✅ V8 isolation with restricted globals
 * ✅ Memory and timeout limits
 */

const { VM } = require('vm2');

exports.handler = async (event, context) => {
    const startTime = Date.now();
    
    try {
        // Extract parameters
        const userCode = event.code || '';
        const testInput = event.testInput;
        const timeoutSeconds = Math.min(event.timeout || 10, 30); // Max 30 seconds
        
        // Validate input
        if (!userCode.trim()) {
            return createErrorResponse('No code provided');
        }
        
        if (userCode.length > 50000) { // 50KB limit
            return createErrorResponse('Code too large (max 50KB)');
        }
        
        // Execute the code
        const result = await executeJavaScriptCode(userCode, testInput, timeoutSeconds * 1000);
        
        // Calculate execution time
        const executionTime = Date.now() - startTime;
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                stdout: result.stdout,
                stderr: result.stderr,
                executionTime: executionTime,
                memoryUsed: estimateMemoryUsage(),
                exitCode: result.success ? 0 : 1
            })
        };
        
    } catch (error) {
        return createErrorResponse(`Execution failed: ${error.message}`);
    }
};

async function executeJavaScriptCode(code, testInput, timeoutMs) {
    // Capture console output
    const output = [];
    const errors = [];
    
    // Create secure VM with restricted sandbox
    const vm = new VM({
        timeout: timeoutMs,
        sandbox: {
            // Safe console implementation
            console: {
                log: (...args) => output.push(args.map(arg => String(arg)).join(' ')),
                error: (...args) => errors.push(args.map(arg => String(arg)).join(' ')),
                warn: (...args) => errors.push('[WARN] ' + args.map(arg => String(arg)).join(' '))
            },
            
            // Inject test input if provided
            testInput: testInput,
            
            // Safe globals
            Math: Math,
            Date: Date,
            JSON: JSON,
            parseInt: parseInt,
            parseFloat: parseFloat,
            isNaN: isNaN,
            isFinite: isFinite,
            
            // Safe string and array methods
            String: String,
            Array: Array,
            Object: Object,
            Number: Number,
            Boolean: Boolean,
            
            // Utility functions
            setTimeout: undefined, // Remove async capabilities
            setInterval: undefined,
            clearTimeout: undefined,
            clearInterval: undefined,
            
            // Remove Node.js globals
            require: undefined,
            module: undefined,
            exports: undefined,
            global: undefined,
            process: undefined,
            Buffer: undefined,
            __dirname: undefined,
            __filename: undefined
        }
    });
    
    try {
        // Execute the user code in the secure VM
        // VM2 provides excellent isolation and prevents:
        // - Access to Node.js APIs
        // - File system access  
        // - Network access
        // - Process manipulation
        const result = vm.run(code);
        
        return {
            success: true,
            stdout: output.join('\\n'),
            stderr: errors.join('\\n'),
            result: result
        };
        
    } catch (error) {
        return {
            success: false,
            stdout: output.join('\\n'),
            stderr: errors.concat([`${error.name}: ${error.message}`]).join('\\n')
        };
    }
}

function estimateMemoryUsage() {
    // Rough estimate of memory usage in MB
    if (process.memoryUsage) {
        const usage = process.memoryUsage();
        return Math.round(usage.heapUsed / 1024 / 1024);
    }
    return 16; // 16MB baseline estimate
}

function createErrorResponse(message, statusCode = 400) {
    return {
        statusCode: statusCode,
        body: JSON.stringify({
            success: false,
            stdout: '',
            stderr: message,
            executionTime: 0,
            memoryUsed: 0,
            exitCode: 1,
            error: message
        })
    };
}

// For local testing
if (require.main === module) {
    const testEvent = {
        code: `
            console.log('Hello, World!');
            
            function factorial(n) {
                if (n <= 1) return 1;
                return n * factorial(n - 1);
            }
            
            const result = factorial(5);
            console.log('Factorial of 5:', result);
            
            result; // Return value
        `,
        timeout: 5
    };
    
    exports.handler(testEvent, null).then(result => {
        console.log(JSON.stringify(result, null, 2));
    });
}