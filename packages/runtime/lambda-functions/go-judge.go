package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
)

// ExecutionRequest represents the input for code execution
type ExecutionRequest struct {
	SourceCode  string `json:"source_code"`
	Input       string `json:"input"`
	TimeLimit   int    `json:"time_limit"`
	MemoryLimit int    `json:"memory_limit"`
}

// ExecutionResponse represents the output of code execution
type ExecutionResponse struct {
	StatusCode int                    `json:"statusCode"`
	Headers    map[string]string      `json:"headers"`
	Body       string                 `json:"body"`
}

// ExecutionResult contains the execution details
type ExecutionResult struct {
	Message       string  `json:"message"`
	Stdout        string  `json:"stdout,omitempty"`
	Stderr        string  `json:"stderr,omitempty"`
	ExitCode      int     `json:"exit_code,omitempty"`
	ExecutionTime float64 `json:"execution_time,omitempty"`
	MemoryUsed    int64   `json:"memory_used,omitempty"`
	CompileOutput string  `json:"compile_output,omitempty"`
	ErrorDetails  string  `json:"error_details,omitempty"`
	Timestamp     int64   `json:"timestamp"`
}

// CompileResult contains compilation results
type CompileResult struct {
	Success bool
	Output  string
	Error   string
}

// LambdaHandler handles the AWS Lambda request
func LambdaHandler(ctx context.Context, request ExecutionRequest) (ExecutionResponse, error) {
	// Set default values
	if request.TimeLimit == 0 {
		request.TimeLimit = 10
	}
	if request.MemoryLimit == 0 {
		request.MemoryLimit = 128
	}
	
	// Enforce limits
	if request.TimeLimit > 30 {
		request.TimeLimit = 30
	}
	if request.MemoryLimit > 512 {
		request.MemoryLimit = 512
	}

	if strings.TrimSpace(request.SourceCode) == "" {
		return createResponse(400, "No source code provided"), nil
	}

	// Create temporary directory
	tempDir, err := ioutil.TempDir("", "go_judge_")
	if err != nil {
		return createResponse(500, fmt.Sprintf("Failed to create temp directory: %v", err)), nil
	}
	defer os.RemoveAll(tempDir)

	// Write source code to file
	goFile := filepath.Join(tempDir, "main.go")
	err = ioutil.WriteFile(goFile, []byte(request.SourceCode), 0644)
	if err != nil {
		return createResponse(500, fmt.Sprintf("Failed to write source code: %v", err)), nil
	}

	// Compile Go code
	compileResult := compileGoCode(goFile, tempDir, request.TimeLimit)
	if !compileResult.Success {
		return createResponse(400, "Compilation failed", map[string]interface{}{
			"compile_output": compileResult.Output,
			"error_details":  compileResult.Error,
		}), nil
	}

	// Execute compiled binary
	execResult := executeGoBinary(filepath.Join(tempDir, "main"), request.Input, request.TimeLimit)

	return createResponse(200, "Execution completed", map[string]interface{}{
		"stdout":         execResult.Stdout,
		"stderr":         execResult.Stderr,
		"exit_code":      execResult.ExitCode,
		"execution_time": execResult.ExecutionTime,
		"memory_used":    execResult.MemoryUsed,
	}), nil
}

func compileGoCode(goFile, workingDir string, timeLimit int) CompileResult {
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(timeLimit)*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "go", "build", "-o", "main", goFile)
	cmd.Dir = workingDir
	
	// Set environment variables for Go compilation
	cmd.Env = append(os.Environ(),
		"GOOS=linux",
		"GOARCH=amd64",
		"CGO_ENABLED=0",
	)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	
	output := stdout.String() + stderr.String()
	
	if err != nil {
		if ctx.Err() == context.DeadlineExceeded {
			return CompileResult{
				Success: false,
				Output:  output,
				Error:   fmt.Sprintf("Compilation timeout (%ds)", timeLimit),
			}
		}
		return CompileResult{
			Success: false,
			Output:  output,
			Error:   fmt.Sprintf("Compilation failed: %v", err),
		}
	}

	return CompileResult{
		Success: true,
		Output:  output,
		Error:   "",
	}
}

func executeGoBinary(binaryPath, input string, timeLimit int) ExecutionResult {
	startTime := time.Now()
	
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(timeLimit)*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, binaryPath)
	
	// Set up input/output pipes
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	
	if input != "" {
		cmd.Stdin = strings.NewReader(input)
	}

	// Execute the binary
	err := cmd.Run()
	
	executionTime := time.Since(startTime).Seconds()
	exitCode := 0
	
	if err != nil {
		if ctx.Err() == context.DeadlineExceeded {
			return ExecutionResult{
				Stdout:        stdout.String(),
				Stderr:        fmt.Sprintf("Time limit exceeded (%ds)", timeLimit),
				ExitCode:      124, // Timeout exit code
				ExecutionTime: executionTime,
				MemoryUsed:    0,
			}
		}
		
		if exitError, ok := err.(*exec.ExitError); ok {
			exitCode = exitError.ExitCode()
		} else {
			exitCode = 1
		}
	}

	return ExecutionResult{
		Stdout:        stdout.String(),
		Stderr:        stderr.String(),
		ExitCode:      exitCode,
		ExecutionTime: executionTime,
		MemoryUsed:    estimateMemoryUsage(),
	}
}

func estimateMemoryUsage() int64 {
	// In a real container environment, you would use cgroups or process monitoring
	// This is a simplified estimation for demonstration
	return 32 // Return estimated MB usage
}

func createResponse(statusCode int, message string, extras ...map[string]interface{}) ExecutionResponse {
	result := ExecutionResult{
		Message:   message,
		Timestamp: time.Now().Unix(),
	}

	// Add any extra fields
	if len(extras) > 0 {
		extra := extras[0]
		if stdout, ok := extra["stdout"]; ok {
			result.Stdout = stdout.(string)
		}
		if stderr, ok := extra["stderr"]; ok {
			result.Stderr = stderr.(string)
		}
		if exitCode, ok := extra["exit_code"]; ok {
			result.ExitCode = exitCode.(int)
		}
		if executionTime, ok := extra["execution_time"]; ok {
			result.ExecutionTime = executionTime.(float64)
		}
		if memoryUsed, ok := extra["memory_used"]; ok {
			result.MemoryUsed = memoryUsed.(int64)
		}
		if compileOutput, ok := extra["compile_output"]; ok {
			result.CompileOutput = compileOutput.(string)
		}
		if errorDetails, ok := extra["error_details"]; ok {
			result.ErrorDetails = errorDetails.(string)
		}
	}

	bodyBytes, _ := json.Marshal(result)

	return ExecutionResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
		},
		Body: string(bodyBytes),
	}
}

func main() {
	// For local testing
	if len(os.Args) > 1 && os.Args[1] == "test" {
		testRequest := ExecutionRequest{
			SourceCode: `
package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func main() {
	fmt.Println("Hello, World!")
	
	// Read input
	reader := bufio.NewReader(os.Stdin)
	if input, err := reader.ReadString('\n'); err == nil {
		input = strings.TrimSpace(input)
		if input != "" {
			fmt.Printf("You entered: %s\n", input)
		}
	}
}
			`,
			Input:       "Test input",
			TimeLimit:   10,
			MemoryLimit: 128,
		}

		result, err := LambdaHandler(context.Background(), testRequest)
		if err != nil {
			fmt.Printf("Error: %v\n", err)
			return
		}

		fmt.Printf("Response: %+v\n", result)
		return
	}

	// Start AWS Lambda handler
	lambda.Start(LambdaHandler)
}