using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using System.Reflection;
using System.Runtime.Loader;

namespace CSharpJudge
{
    public class Function
    {
        public async Task<object> FunctionHandler(object input)
        {
            try
            {
                // Parse input JSON
                var json = JsonSerializer.Serialize(input);
                var request = JsonSerializer.Deserialize<ExecutionRequest>(json);

                if (string.IsNullOrWhiteSpace(request.SourceCode))
                {
                    return CreateResponse(400, "No source code provided");
                }

                // Compile C# code
                var compileResult = await CompileCSharpCode(request.SourceCode);
                if (!compileResult.Success)
                {
                    return CreateResponse(400, "Compilation failed", compileOutput: compileResult.Error);
                }

                // Execute compiled assembly
                var executionResult = await ExecuteAssembly(
                    compileResult.Assembly, 
                    request.Input ?? "", 
                    request.TimeLimit, 
                    request.MemoryLimit
                );

                return CreateResponse(
                    200, 
                    "Execution completed",
                    stdout: executionResult.Stdout,
                    stderr: executionResult.Stderr,
                    executionTime: executionResult.ExecutionTime,
                    memoryUsed: executionResult.MemoryUsed,
                    exitCode: executionResult.ExitCode
                );
            }
            catch (Exception ex)
            {
                return CreateResponse(500, $"Internal server error: {ex.Message}", errorDetails: ex.ToString());
            }
        }

        private async Task<CompileResult> CompileCSharpCode(string sourceCode)
        {
            try
            {
                var syntaxTree = CSharpSyntaxTree.ParseText(sourceCode);

                // Add required references
                var references = new[]
                {
                    MetadataReference.CreateFromFile(typeof(object).Assembly.Location),
                    MetadataReference.CreateFromFile(typeof(Console).Assembly.Location),
                    MetadataReference.CreateFromFile(typeof(System.Collections.Generic.List<>).Assembly.Location),
                    MetadataReference.CreateFromFile(Assembly.Load("System.Runtime").Location),
                    MetadataReference.CreateFromFile(Assembly.Load("System.Console").Location),
                };

                var compilation = CSharpCompilation.Create(
                    "DynamicAssembly",
                    new[] { syntaxTree },
                    references,
                    new CSharpCompilationOptions(OutputKind.ConsoleApplication)
                        .WithOptimizationLevel(OptimizationLevel.Release)
                        .WithPlatform(Platform.AnyCpu)
                );

                using var ms = new MemoryStream();
                var result = compilation.Emit(ms);

                if (!result.Success)
                {
                    var errors = new StringBuilder();
                    foreach (var diagnostic in result.Diagnostics)
                    {
                        if (diagnostic.Severity == DiagnosticSeverity.Error)
                        {
                            errors.AppendLine($"Error: {diagnostic.GetMessage()}");
                        }
                    }
                    
                    return new CompileResult
                    {
                        Success = false,
                        Error = errors.ToString(),
                        Assembly = null
                    };
                }

                ms.Seek(0, SeekOrigin.Begin);
                var assembly = AssemblyLoadContext.Default.LoadFromStream(ms);

                return new CompileResult
                {
                    Success = true,
                    Error = null,
                    Assembly = assembly
                };
            }
            catch (Exception ex)
            {
                return new CompileResult
                {
                    Success = false,
                    Error = $"Compilation exception: {ex.Message}",
                    Assembly = null
                };
            }
        }

        private async Task<ExecutionResult> ExecuteAssembly(Assembly assembly, string input, int timeLimit, int memoryLimit)
        {
            var stopwatch = Stopwatch.StartNew();
            
            try
            {
                // Find the Main method
                var entryPoint = assembly.EntryPoint;
                if (entryPoint == null)
                {
                    return new ExecutionResult
                    {
                        Stdout = "",
                        Stderr = "No Main method found",
                        ExitCode = 1,
                        ExecutionTime = 0,
                        MemoryUsed = 0
                    };
                }

                // Redirect console I/O for capturing output
                var originalOut = Console.Out;
                var originalIn = Console.In;
                var originalError = Console.Error;

                using var stdout = new StringWriter();
                using var stderr = new StringWriter();
                using var stdin = new StringReader(input);

                Console.SetOut(stdout);
                Console.SetError(stderr);
                Console.SetIn(stdin);

                int exitCode = 0;

                try
                {
                    // Create cancellation token for timeout
                    using var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(timeLimit));
                    
                    // Execute the Main method in a task for timeout control
                    await Task.Run(() =>
                    {
                        try
                        {
                            var parameters = entryPoint.GetParameters();
                            if (parameters.Length > 0 && parameters[0].ParameterType == typeof(string[]))
                            {
                                entryPoint.Invoke(null, new object[] { new string[0] });
                            }
                            else
                            {
                                entryPoint.Invoke(null, null);
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.Error.WriteLine($"Runtime error: {ex.Message}");
                            exitCode = 1;
                        }
                    }, cts.Token);
                }
                catch (OperationCanceledException)
                {
                    stderr.WriteLine($"Time limit exceeded ({timeLimit}s)");
                    exitCode = 124;
                }
                finally
                {
                    // Restore console I/O
                    Console.SetOut(originalOut);
                    Console.SetError(originalError);
                    Console.SetIn(originalIn);
                }

                stopwatch.Stop();

                return new ExecutionResult
                {
                    Stdout = stdout.ToString(),
                    Stderr = stderr.ToString(),
                    ExitCode = exitCode,
                    ExecutionTime = stopwatch.Elapsed.TotalSeconds,
                    MemoryUsed = EstimateMemoryUsage()
                };
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                return new ExecutionResult
                {
                    Stdout = "",
                    Stderr = $"Execution error: {ex.Message}",
                    ExitCode = 1,
                    ExecutionTime = stopwatch.Elapsed.TotalSeconds,
                    MemoryUsed = 0
                };
            }
        }

        private long EstimateMemoryUsage()
        {
            try
            {
                GC.Collect();
                GC.WaitForPendingFinalizers();
                return GC.GetTotalMemory(false) / (1024 * 1024); // Convert to MB
            }
            catch
            {
                return 0;
            }
        }

        private object CreateResponse(int statusCode, string message, 
            string stdout = null, string stderr = null, double? executionTime = null, 
            long? memoryUsed = null, int? exitCode = null, string compileOutput = null, 
            string errorDetails = null)
        {
            var response = new Dictionary<string, object>
            {
                ["message"] = message,
                ["timestamp"] = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            };

            if (stdout != null) response["stdout"] = stdout;
            if (stderr != null) response["stderr"] = stderr;
            if (executionTime.HasValue) response["execution_time"] = executionTime.Value;
            if (memoryUsed.HasValue) response["memory_used"] = memoryUsed.Value;
            if (exitCode.HasValue) response["exit_code"] = exitCode.Value;
            if (compileOutput != null) response["compile_output"] = compileOutput;
            if (errorDetails != null) response["error_details"] = errorDetails;

            return new
            {
                StatusCode = statusCode,
                Headers = new Dictionary<string, string>
                {
                    ["Content-Type"] = "application/json",
                    ["Access-Control-Allow-Origin"] = "*"
                },
                Body = JsonSerializer.Serialize(response)
            };
        }
    }

    public class ExecutionRequest
    {
        public string SourceCode { get; set; } = "";
        public string Input { get; set; } = "";
        public int TimeLimit { get; set; } = 10;
        public int MemoryLimit { get; set; } = 128;
    }

    public class CompileResult
    {
        public bool Success { get; set; }
        public string Error { get; set; }
        public Assembly Assembly { get; set; }
    }

    public class ExecutionResult
    {
        public string Stdout { get; set; } = "";
        public string Stderr { get; set; } = "";
        public int ExitCode { get; set; }
        public double ExecutionTime { get; set; }
        public long MemoryUsed { get; set; }
    }
}