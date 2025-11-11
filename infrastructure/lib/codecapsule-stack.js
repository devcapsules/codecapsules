"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeCapsuleStack = void 0;
const cdk = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const iam = require("aws-cdk-lib/aws-iam");
const logs = require("aws-cdk-lib/aws-logs");
const ecr = require("aws-cdk-lib/aws-ecr");
const path = require("path");
class CodeCapsuleStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // ===== NATIVE RUNTIME LAMBDA FUNCTIONS =====
        // Python Judge - Native Runtime
        const pythonJudge = new lambda.Function(this, 'PythonJudge', {
            runtime: lambda.Runtime.PYTHON_3_11,
            handler: 'python-judge.lambda_handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../../packages/runtime/lambda-functions'), {
                exclude: ['*.js', '*.go', '*.cs', '*.java', 'deployment/**', 'README.md']
            }),
            timeout: cdk.Duration.seconds(30),
            memorySize: 512,
            environment: {
                PYTHONPATH: '/var/runtime:/var/task:/opt/python',
                LOG_LEVEL: 'INFO'
            },
            description: 'CodeCapsule Python code execution judge',
            logRetention: logs.RetentionDays.ONE_WEEK,
            tracing: lambda.Tracing.ACTIVE,
        });
        // JavaScript Judge - Node.js Runtime
        const jsJudge = new lambda.Function(this, 'JavaScriptJudge', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'javascript-judge.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../../packages/runtime/lambda-functions'), {
                exclude: ['*.py', '*.go', '*.cs', '*.java', 'deployment/**', 'README.md'],
                bundling: {
                    image: lambda.Runtime.NODEJS_20_X.bundlingImage,
                    command: [
                        'bash', '-c',
                        'npm install vm2 && cp -r . /asset-output/'
                    ]
                }
            }),
            timeout: cdk.Duration.seconds(30),
            memorySize: 512,
            environment: {
                NODE_ENV: 'production',
                LOG_LEVEL: 'INFO'
            },
            description: 'CodeCapsule JavaScript code execution judge with VM2 sandboxing',
            logRetention: logs.RetentionDays.ONE_WEEK,
            tracing: lambda.Tracing.ACTIVE,
        });
        // SQL Judge - Python with psycopg2
        const sqlJudge = new lambda.Function(this, 'SQLJudge', {
            runtime: lambda.Runtime.PYTHON_3_12,
            handler: 'sql-judge.lambda_handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../../packages/runtime/lambda-functions'), {
                exclude: ['*.js', '*.go', '*.cs', '*.java', 'deployment/**', 'README.md'],
                bundling: {
                    image: lambda.Runtime.PYTHON_3_12.bundlingImage,
                    command: [
                        'bash', '-c',
                        'pip install psycopg2-binary supabase && cp -r . /asset-output/'
                    ]
                }
            }),
            timeout: cdk.Duration.seconds(30),
            memorySize: 256,
            environment: {
                SUPABASE_URL: process.env.SUPABASE_URL || '',
                SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
                DB_HOST: process.env.DB_HOST || '',
                DB_NAME: process.env.DB_NAME || 'postgres',
                DB_USER: process.env.DB_USER || 'readonly_user',
                DB_PASSWORD: process.env.DB_PASSWORD || '',
                PYTHONPATH: '/var/runtime:/var/task:/opt/python'
            },
            description: 'CodeCapsule SQL query execution judge with Supabase integration',
            logRetention: logs.RetentionDays.ONE_WEEK,
            tracing: lambda.Tracing.ACTIVE,
        });
        // ===== CONTAINER-BASED LAMBDA FUNCTIONS =====
        // ECR Repositories for container images
        const javaRepo = new ecr.Repository(this, 'JavaJudgeRepo', {
            repositoryName: 'codecapsule/java-judge',
            lifecycleRules: [{
                    maxImageCount: 5,
                    description: 'Keep only 5 most recent images'
                }]
        });
        const csharpRepo = new ecr.Repository(this, 'CSharpJudgeRepo', {
            repositoryName: 'codecapsule/csharp-judge',
            lifecycleRules: [{
                    maxImageCount: 5,
                    description: 'Keep only 5 most recent images'
                }]
        });
        const goRepo = new ecr.Repository(this, 'GoJudgeRepo', {
            repositoryName: 'codecapsule/go-judge',
            lifecycleRules: [{
                    maxImageCount: 5,
                    description: 'Keep only 5 most recent images'
                }]
        });
        // Java Judge - Container Image
        const javaJudge = new lambda.Function(this, 'JavaJudge', {
            runtime: lambda.Runtime.FROM_IMAGE,
            code: lambda.Code.fromAssetImage(path.join(__dirname, '../../packages/runtime/lambda-functions'), {
                cmd: ['java-judge.lambda_handler'],
                file: 'Dockerfile.java',
                buildArgs: {
                    LAMBDA_TASK_ROOT: '/var/task'
                }
            }),
            timeout: cdk.Duration.seconds(60),
            memorySize: 1024,
            ephemeralStorageSize: cdk.Size.mebibytes(1024),
            environment: {
                JAVA_HOME: '/opt/java/openjdk',
                PATH: '/opt/java/openjdk/bin:/usr/local/bin:/usr/bin:/bin'
            },
            description: 'CodeCapsule Java compilation and execution judge',
            logRetention: logs.RetentionDays.ONE_WEEK,
            tracing: lambda.Tracing.ACTIVE,
        });
        // C# Judge - Container Image
        const csharpJudge = new lambda.Function(this, 'CSharpJudge', {
            runtime: lambda.Runtime.FROM_IMAGE,
            code: lambda.Code.fromAssetImage(path.join(__dirname, '../../packages/runtime/lambda-functions'), {
                cmd: ['CSharpJudge::CSharpJudge.Function::FunctionHandler'],
                file: 'Dockerfile.csharp'
            }),
            timeout: cdk.Duration.seconds(60),
            memorySize: 1024,
            ephemeralStorageSize: cdk.Size.mebibytes(1024),
            environment: {
                DOTNET_ROOT: '/usr/share/dotnet',
                PATH: '/usr/share/dotnet:/usr/local/bin:/usr/bin:/bin'
            },
            description: 'CodeCapsule C# compilation and execution judge',
            logRetention: logs.RetentionDays.ONE_WEEK,
            tracing: lambda.Tracing.ACTIVE,
        });
        // Go Judge - Container Image
        const goJudge = new lambda.Function(this, 'GoJudge', {
            runtime: lambda.Runtime.FROM_IMAGE,
            code: lambda.Code.fromAssetImage(path.join(__dirname, '../../packages/runtime/lambda-functions'), {
                cmd: ['bootstrap'],
                file: 'Dockerfile.go'
            }),
            timeout: cdk.Duration.seconds(60),
            memorySize: 512,
            ephemeralStorageSize: cdk.Size.mebibytes(512),
            environment: {
                GOROOT: '/usr/local/go',
                GOPATH: '/tmp/go',
                PATH: '/usr/local/go/bin:/usr/local/bin:/usr/bin:/bin'
            },
            description: 'CodeCapsule Go compilation and execution judge',
            logRetention: logs.RetentionDays.ONE_WEEK,
            tracing: lambda.Tracing.ACTIVE,
        });
        // ===== IAM ROLES AND PERMISSIONS =====
        // Common execution role for all Lambda functions
        const lambdaExecutionRole = new iam.Role(this, 'CodeCapsuleLambdaExecutionRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            description: 'Execution role for CodeCapsule Lambda functions',
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess')
            ],
            inlinePolicies: {
                CodeCapsulePolicy: new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: [
                                'logs:CreateLogGroup',
                                'logs:CreateLogStream',
                                'logs:PutLogEvents'
                            ],
                            resources: ['arn:aws:logs:*:*:*']
                        })
                    ]
                })
            }
        });
        // ===== API GATEWAY =====
        // Create API Gateway
        const api = new apigateway.RestApi(this, 'CodeCapsuleAPI', {
            restApiName: 'CodeCapsule Execution API',
            description: 'Serverless code execution API for CodeCapsule platform',
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
            },
            deployOptions: {
                stageName: 'prod',
                throttle: {
                    rateLimit: 1000,
                    burstLimit: 2000
                },
                loggingLevel: apigateway.MethodLoggingLevel.INFO,
                dataTraceEnabled: true,
                metricsEnabled: true
            }
        });
        // Create execution resource
        const execution = api.root.addResource('execute');
        // Add language-specific endpoints with Lambda integrations
        const pythonIntegration = new apigateway.LambdaIntegration(pythonJudge, {
            requestTemplates: { 'application/json': '{"body": $input.json("$")}' },
            proxy: false,
            integrationResponses: [{
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Access-Control-Allow-Origin': "'*'"
                    }
                }]
        });
        const jsIntegration = new apigateway.LambdaIntegration(jsJudge, {
            requestTemplates: { 'application/json': '{"body": $input.json("$")}' },
            proxy: false,
            integrationResponses: [{
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Access-Control-Allow-Origin': "'*'"
                    }
                }]
        });
        const sqlIntegration = new apigateway.LambdaIntegration(sqlJudge, {
            requestTemplates: { 'application/json': '{"body": $input.json("$")}' },
            proxy: false,
            integrationResponses: [{
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Access-Control-Allow-Origin': "'*'"
                    }
                }]
        });
        const javaIntegration = new apigateway.LambdaIntegration(javaJudge, {
            requestTemplates: { 'application/json': '{"body": $input.json("$")}' },
            proxy: false,
            integrationResponses: [{
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Access-Control-Allow-Origin': "'*'"
                    }
                }]
        });
        const csharpIntegration = new apigateway.LambdaIntegration(csharpJudge, {
            requestTemplates: { 'application/json': '{"body": $input.json("$")}' },
            proxy: false,
            integrationResponses: [{
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Access-Control-Allow-Origin': "'*'"
                    }
                }]
        });
        const goIntegration = new apigateway.LambdaIntegration(goJudge, {
            requestTemplates: { 'application/json': '{"body": $input.json("$")}' },
            proxy: false,
            integrationResponses: [{
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Access-Control-Allow-Origin': "'*'"
                    }
                }]
        });
        // Add methods for each language
        const methodOptions = {
            methodResponses: [{
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Access-Control-Allow-Origin': true
                    }
                }]
        };
        execution.addResource('python').addMethod('POST', pythonIntegration, methodOptions);
        execution.addResource('javascript').addMethod('POST', jsIntegration, methodOptions);
        execution.addResource('sql').addMethod('POST', sqlIntegration, methodOptions);
        execution.addResource('java').addMethod('POST', javaIntegration, methodOptions);
        execution.addResource('csharp').addMethod('POST', csharpIntegration, methodOptions);
        execution.addResource('go').addMethod('POST', goIntegration, methodOptions);
        // Add health check endpoint
        const healthResource = api.root.addResource('health');
        const healthLambda = new lambda.Function(this, 'HealthCheck', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'index.handler',
            code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
              status: 'healthy',
              timestamp: new Date().toISOString(),
              version: '1.0.0',
              services: {
                python: 'available',
                javascript: 'available',
                sql: 'available',
                java: 'available',
                csharp: 'available',
                go: 'available'
              }
            })
          };
        };
      `),
            description: 'Health check endpoint for CodeCapsule API'
        });
        healthResource.addMethod('GET', new apigateway.LambdaIntegration(healthLambda));
        // ===== OUTPUTS =====
        new cdk.CfnOutput(this, 'APIGatewayURL', {
            value: api.url,
            description: 'API Gateway URL for CodeCapsule execution engine',
            exportName: 'CodeCapsuleAPIURL'
        });
        new cdk.CfnOutput(this, 'PythonJudgeArn', {
            value: pythonJudge.functionArn,
            description: 'Python judge Lambda function ARN'
        });
        new cdk.CfnOutput(this, 'JavaScriptJudgeArn', {
            value: jsJudge.functionArn,
            description: 'JavaScript judge Lambda function ARN'
        });
        new cdk.CfnOutput(this, 'SQLJudgeArn', {
            value: sqlJudge.functionArn,
            description: 'SQL judge Lambda function ARN'
        });
        new cdk.CfnOutput(this, 'JavaJudgeArn', {
            value: javaJudge.functionArn,
            description: 'Java judge Lambda function ARN'
        });
        new cdk.CfnOutput(this, 'CSharpJudgeArn', {
            value: csharpJudge.functionArn,
            description: 'C# judge Lambda function ARN'
        });
        new cdk.CfnOutput(this, 'GoJudgeArn', {
            value: goJudge.functionArn,
            description: 'Go judge Lambda function ARN'
        });
        new cdk.CfnOutput(this, 'JavaECRRepository', {
            value: javaRepo.repositoryUri,
            description: 'ECR repository for Java judge container'
        });
        new cdk.CfnOutput(this, 'CSharpECRRepository', {
            value: csharpRepo.repositoryUri,
            description: 'ECR repository for C# judge container'
        });
        new cdk.CfnOutput(this, 'GoECRRepository', {
            value: goRepo.repositoryUri,
            description: 'ECR repository for Go judge container'
        });
        // Tag all resources
        cdk.Tags.of(this).add('Project', 'CodeCapsule');
        cdk.Tags.of(this).add('Component', 'ServerlessExecution');
        cdk.Tags.of(this).add('Environment', process.env.STAGE || 'dev');
        cdk.Tags.of(this).add('ManagedBy', 'CDK');
    }
}
exports.CodeCapsuleStack = CodeCapsuleStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZWNhcHN1bGUtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb2RlY2Fwc3VsZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMsaURBQWlEO0FBQ2pELHlEQUF5RDtBQUN6RCwyQ0FBMkM7QUFDM0MsNkNBQTZDO0FBQzdDLDJDQUEyQztBQUUzQyw2QkFBNkI7QUFFN0IsTUFBYSxnQkFBaUIsU0FBUSxHQUFHLENBQUMsS0FBSztJQUM3QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLDhDQUE4QztRQUU5QyxnQ0FBZ0M7UUFDaEMsTUFBTSxXQUFXLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDM0QsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsNkJBQTZCO1lBQ3RDLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSx5Q0FBeUMsQ0FBQyxFQUFFO2dCQUMzRixPQUFPLEVBQUUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsZUFBZSxFQUFFLFdBQVcsQ0FBQzthQUMxRSxDQUFDO1lBQ0YsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNqQyxVQUFVLEVBQUUsR0FBRztZQUNmLFdBQVcsRUFBRTtnQkFDWCxVQUFVLEVBQUUsb0NBQW9DO2dCQUNoRCxTQUFTLEVBQUUsTUFBTTthQUNsQjtZQUNELFdBQVcsRUFBRSx5Q0FBeUM7WUFDdEQsWUFBWSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUTtZQUN6QyxPQUFPLEVBQUUs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QUksRUFBRSxxQkFBcUIsRUFBRTtZQUM3QyxLQUFLLEVBQUUsVUFBVSxDQUFDLGFBQWE7WUFDL0IsV0FBVyxFQUFFLHVDQUF1QztTQUNyRCxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQ3pDLEtBQUssRUFBRSxNQUFNLENBQUMsYUFBYTtZQUMzQixXQUFXLEVBQUUsdUNBQXVDO1NBQ3JELENBQUMsQ0FBQztRQUVILG9CQUFvQjtRQUNwQixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ2hELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUscUJBQXFCLENBQUMsQ0FBQztRQUMxRCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxDQUFDO1FBQ2pFLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDNUMsQ0FBQztDQUNGO0FBN1lELDRDQTZZQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XHJcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcclxuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XHJcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcclxuaW1wb3J0ICogYXMgbG9ncyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbG9ncyc7XHJcbmltcG9ydCAqIGFzIGVjciBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWNyJztcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XHJcblxyXG5leHBvcnQgY2xhc3MgQ29kZUNhcHN1bGVTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XHJcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xyXG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XHJcblxyXG4gICAgLy8gPT09PT0gTkFUSVZFIFJVTlRJTUUgTEFNQkRBIEZVTkNUSU9OUyA9PT09PVxyXG5cclxuICAgIC8vIFB5dGhvbiBKdWRnZSAtIE5hdGl2ZSBSdW50aW1lXHJcbiAgICBjb25zdCBweXRob25KdWRnZSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ1B5dGhvbkp1ZGdlJywge1xyXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5QWVRIT05fM18xMSxcclxuICAgICAgaGFuZGxlcjogJ3B5dGhvbi1qdWRnZS5sYW1iZGFfaGFuZGxlcicsXHJcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vcGFja2FnZXMvcnVudGltZS9sYW1iZGEtZnVuY3Rpb25zJyksIHtcclxuICAgICAgICBleGNsdWRlOiBbJyouanMnLCAnKi5nbycsICcqLmNzJywgJyouamF2YScsICdkZXBsb3ltZW50LyoqJywgJ1JFQURNRS5tZCddXHJcbiAgICAgIH0pLFxyXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXHJcbiAgICAgIG1lbW9yeVNpemU6IDUxMixcclxuICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICBQWVRIT05QQVRIOiAnL3Zhci9ydW50aW1lOi92YXIvdGFzazovb3B0L3B5dGhvbicsXHJcbiAgICAgICAgTE9HX0xFVkVMOiAnSU5GTydcclxuICAgICAgfSxcclxuICAgICAgZGVzY3JpcHRpb246ICdDb2RlQ2Fwc3VsZSBQeXRob24gY29kZSBleGVjdXRpb24ganVkZ2UnLFxyXG4gICAgICBsb2dSZXRlbnRpb246IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfV0VFSyxcclxuICAgICAgdHJhY2luZzogbGFtYmRhLlRyYWNpbmcuQUNUSVZFLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gSmF2YVNjcmlwdCBKdWRnZSAtIE5vZGUuanMgUnVudGltZVxyXG4gICAgY29uc3QganNKdWRnZSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0phdmFTY3JpcHRKdWRnZScsIHtcclxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXHJcbiAgICAgIGhhbmRsZXI6ICdqYXZhc2NyaXB0LWp1ZGdlLmhhbmRsZXInLFxyXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uL3BhY2thZ2VzL3J1bnRpbWUvbGFtYmRhLWZ1bmN0aW9ucycpLCB7XHJcbiAgICAgICAgZXhjbHVkZTogWycqLnB5JywgJyouZ28nLCAnKi5jcycsICcqLmphdmEnLCAnZGVwbG95bWVudC8qKicsICdSRUFETUUubWQnXSxcclxuICAgICAgICBidW5kbGluZzoge1xyXG4gICAgICAgICAgaW1hZ2U6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLmJ1bmRsaW5nSW1hZ2UsXHJcbiAgICAgICAgICBjb21tYW5kOiBbXHJcbiAgICAgICAgICAgICdiYXNoJywgJy1jJyxcclxuICAgICAgICAgICAgJ25wbSBpbnN0YWxsIHZtMiAmJiBjcCAtciAuIC9hc3NldC1vdXRwdXQvJ1xyXG4gICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgICAgfSksXHJcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcclxuICAgICAgbWVtb3J5U2l6ZTogNTEyLFxyXG4gICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgIE5PREVfRU5WOiAncHJvZHVjdGlvbicsXHJcbiAgICAgICAgTE9HX0xFVkVMOiAnSU5GTydcclxuICAgICAgfSxcclxuICAgICAgZGVzY3JpcHRpb246ICdDb2RlQ2Fwc3VsZSBKYXZhU2NyaXB0IGNvZGUgZXhlY3V0aW9uIGp1ZGdlIHdpdGggVk0yIHNhbmRib3hpbmcnLFxyXG4gICAgICBsb2dSZXRlbnRpb246IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfV0VFSyxcclxuICAgICAgdHJhY2luZzogbGFtYmRhLlRyYWNpbmcuQUNUSVZFLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gU1FMIEp1ZGdlIC0gUHl0aG9uIHdpdGggcHN5Y29wZzJcclxuICAgIGNvbnN0IHNxbEp1ZGdlID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnU1FMSnVkZ2UnLCB7XHJcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLlBZVEhPTl8zXzEyLFxyXG4gICAgICBoYW5kbGVyOiAnc3FsLWp1ZGdlLmxhbWJkYV9oYW5kbGVyJyxcclxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi9wYWNrYWdlcy9ydW50aW1lL2xhbWJkYS1mdW5jdGlvbnMnKSwge1xyXG4gICAgICAgIGV4Y2x1ZGU6IFsnKi5qcycsICcqLmdvJywgJyouY3MnLCAnKi5qYXZhJywgJ2RlcGxveW1lbnQvKionLCAnUkVBRE1FLm1kJ10sXHJcbiAgICAgICAgYnVuZGxpbmc6IHtcclxuICAgICAgICAgIGltYWdlOiBsYW1iZGEuUnVudGltZS5QWVRIT05fM18xMi5idW5kbGluZ0ltYWdlLFxyXG4gICAgICAgICAgY29tbWFuZDogW1xyXG4gICAgICAgICAgICAnYmFzaCcsICctYycsXHJcbiAgICAgICAgICAgICdwaXAgaW5zdGFsbCBwc3ljb3BnMi1iaW5hcnkgc3VwYWJhc2UgJiYgY3AgLXIgLiAvYXNzZXQtb3V0cHV0LydcclxuICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICAgIH0pLFxyXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXHJcbiAgICAgIG1lbW9yeVNpemU6IDI1NixcclxuICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICBTVVBBQkFTRV9VUkw6IHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTCB8fCAnJyxcclxuICAgICAgICBTVVBBQkFTRV9TRVJWSUNFX0tFWTogcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9LRVkgfHwgJycsXHJcbiAgICAgICAgREJfSE9TVDogcHJvY2Vzcy5lbnYuREJfSE9TVCB8fCAnJyxcclxuICAgICAgICBEQl9OQU1FOiBwcm9jZXNzLmVudi5EQl9OQU1FIHx8ICdwb3N0Z3JlcycsXHJcbiAgICAgICAgREJfVVNFUjogcHJvY2Vzcy5lbnYuREJfVVNFUiB8fCAncmVhZG9ubHlfdXNlcicsXHJcbiAgICAgICAgREJfUEFTU1dPUkQ6IHByb2Nlc3MuZW52LkRCX1BBU1NXT1JEIHx8ICcnLFxyXG4gICAgICAgIFBZVEhPTlBBVEg6ICcvdmFyL3J1bnRpbWU6L3Zhci90YXNrOi9vcHQvcHl0aG9uJ1xyXG4gICAgICB9LFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvZGVDYXBzdWxlIFNRTCBxdWVyeSBleGVjdXRpb24ganVkZ2Ugd2l0aCBTdXBhYmFzZSBpbnRlZ3JhdGlvbicsXHJcbiAgICAgIGxvZ1JldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9XRUVLLFxyXG4gICAgICB0cmFjaW5nOiBsYW1iZGEuVHJhY2luZy5BQ1RJVkUsXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT09PSBDT05UQUlORVItQkFTRUQgTEFNQkRBIEZVTkNUSU9OUyA9PT09PVxyXG5cclxuICAgIC8vIEVDUiBSZXBvc2l0b3JpZXMgZm9yIGNvbnRhaW5lciBpbWFnZXNcclxuICAgIGNvbnN0IGphdmFSZXBvID0gbmV3IGVjci5SZXBvc2l0b3J5KHRoaXMsICdKYXZhSnVkZ2VSZXBvJywge1xyXG4gICAgICByZXBvc2l0b3J5TmFtZTogJ2NvZGVjYXBzdWxlL2phdmEtanVkZ2UnLFxyXG4gICAgICBsaWZlY3ljbGVSdWxlczogW3tcclxuICAgICAgICBtYXhJbWFnZUNvdW50OiA1LFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnS2VlcCBvbmx5IDUgbW9zdCByZWNlbnQgaW1hZ2VzJ1xyXG4gICAgICB9XVxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgY3NoYXJwUmVwbyA9IG5ldyBlY3IuUmVwb3NpdG9yeSh0aGlzLCAnQ1NoYXJwSnVkZ2VSZXBvJywge1xyXG4gICAgICByZXBvc2l0b3J5TmFtZTogJ2NvZGVjYXBzdWxlL2NzaGFycC1qdWRnZScsXHJcbiAgICAgIGxpZmVjeWNsZVJ1bGVzOiBbe1xyXG4gICAgICAgIG1heEltYWdlQ291bnQ6IDUsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdLZWVwIG9ubHkgNSBtb3N0IHJlY2VudCBpbWFnZXMnXHJcbiAgICAgIH1dXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBnb1JlcG8gPSBuZXcgZWNyLlJlcG9zaXRvcnkodGhpcywgJ0dvSnVkZ2VSZXBvJywge1xyXG4gICAgICByZXBvc2l0b3J5TmFtZTogJ2NvZGVjYXBzdWxlL2dvLWp1ZGdlJyxcclxuICAgICAgbGlmZWN5Y2xlUnVsZXM6IFt7XHJcbiAgICAgICAgbWF4SW1hZ2VDb3VudDogNSxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ0tlZXAgb25seSA1IG1vc3QgcmVjZW50IGltYWdlcydcclxuICAgICAgfV1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEphdmEgSnVkZ2UgLSBDb250YWluZXIgSW1hZ2VcclxuICAgIGNvbnN0IGphdmFKdWRnZSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0phdmFKdWRnZScsIHtcclxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuRlJPTV9JTUFHRSxcclxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0SW1hZ2UocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uL3BhY2thZ2VzL3J1bnRpbWUvbGFtYmRhLWZ1bmN0aW9ucycpLCB7XHJcbiAgICAgICAgY21kOiBbJ2phdmEtanVkZ2UubGFtYmRhX2hhbmRsZXInXSxcclxuICAgICAgICBmaWxlOiAnRG9ja2VyZmlsZS5qYXZhJyxcclxuICAgICAgICBidWlsZEFyZ3M6IHtcclxuICAgICAgICAgIExBTUJEQV9UQVNLX1JPT1Q6ICcvdmFyL3Rhc2snXHJcbiAgICAgICAgfVxyXG4gICAgICB9KSxcclxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoNjApLFxyXG4gICAgICBtZW1vcnlTaXplOiAxMDI0LFxyXG4gICAgICBlcGhlbWVyYWxTdG9yYWdlU2l6ZTogY2RrLlNpemUubWViaWJ5dGVzKDEwMjQpLFxyXG4gICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgIEpBVkFfSE9NRTogJy9vcHQvamF2YS9vcGVuamRrJyxcclxuICAgICAgICBQQVRIOiAnL29wdC9qYXZhL29wZW5qZGsvYmluOi91c3IvbG9jYWwvYmluOi91c3IvYmluOi9iaW4nXHJcbiAgICAgIH0sXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29kZUNhcHN1bGUgSmF2YSBjb21waWxhdGlvbiBhbmQgZXhlY3V0aW9uIGp1ZGdlJyxcclxuICAgICAgbG9nUmV0ZW50aW9uOiBsb2dzLlJldGVudGlvbkRheXMuT05FX1dFRUssXHJcbiAgICAgIHRyYWNpbmc6IGxhbWJkYS5UcmFjaW5nLkFDVElWRSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEMjIEp1ZGdlIC0gQ29udGFpbmVyIEltYWdlXHJcbiAgICBjb25zdCBjc2hhcnBKdWRnZSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0NTaGFycEp1ZGdlJywge1xyXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5GUk9NX0lNQUdFLFxyXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXRJbWFnZShwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vcGFja2FnZXMvcnVudGltZS9sYW1iZGEtZnVuY3Rpb25zJyksIHtcclxuICAgICAgICBjbWQ6IFsnQ1NoYXJwSnVkZ2U6OkNTaGFycEp1ZGdlLkZ1bmN0aW9uOjpGdW5jdGlvbkhhbmRsZXInXSxcclxuICAgICAgICBmaWxlOiAnRG9ja2VyZmlsZS5jc2hhcnAnXHJcbiAgICAgIH0pLFxyXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcyg2MCksXHJcbiAgICAgIG1lbW9yeVNpemU6IDEwMjQsXHJcbiAgICAgIGVwaGVtZXJhbFN0b3JhZ2VTaXplOiBjZGsuU2l6ZS5tZWJpYnl0ZXMoMTAyNCksXHJcbiAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgRE9UTkVUX1JPT1Q6ICcvdXNyL3NoYXJlL2RvdG5ldCcsXHJcbiAgICAgICAgUEFUSDogJy91c3Ivc2hhcmUvZG90bmV0Oi91c3IvbG9jYWwvYmluOi91c3IvYmluOi9iaW4nXHJcbiAgICAgIH0sXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29kZUNhcHN1bGUgQyMgY29tcGlsYXRpb24gYW5kIGV4ZWN1dGlvbiBqdWRnZScsXHJcbiAgICAgIGxvZ1JldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9XRUVLLFxyXG4gICAgICB0cmFjaW5nOiBsYW1iZGEuVHJhY2luZy5BQ1RJVkUsXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBHbyBKdWRnZSAtIENvbnRhaW5lciBJbWFnZVxyXG4gICAgY29uc3QgZ29KdWRnZSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0dvSnVkZ2UnLCB7XHJcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLkZST01fSU1BR0UsXHJcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldEltYWdlKHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi9wYWNrYWdlcy9ydW50aW1lL2xhbWJkYS1mdW5jdGlvbnMnKSwge1xyXG4gICAgICAgIGNtZDogWydib290c3RyYXAnXSxcclxuICAgICAgICBmaWxlOiAnRG9ja2VyZmlsZS5nbydcclxuICAgICAgfSksXHJcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDYwKSxcclxuICAgICAgbWVtb3J5U2l6ZTogNTEyLFxyXG4gICAgICBlcGhlbWVyYWxTdG9yYWdlU2l6ZTogY2RrLlNpemUubWViaWJ5dGVzKDUxMiksXHJcbiAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgR09ST09UOiAnL3Vzci9sb2NhbC9nbycsXHJcbiAgICAgICAgR09QQVRIOiAnL3RtcC9nbycsXHJcbiAgICAgICAgUEFUSDogJy91c3IvbG9jYWwvZ28vYmluOi91c3IvbG9jYWwvYmluOi91c3IvYmluOi9iaW4nXHJcbiAgICAgIH0sXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29kZUNhcHN1bGUgR28gY29tcGlsYXRpb24gYW5kIGV4ZWN1dGlvbiBqdWRnZScsXHJcbiAgICAgIGxvZ1JldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9XRUVLLFxyXG4gICAgICB0cmFjaW5nOiBsYW1iZGEuVHJhY2luZy5BQ1RJVkUsXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT09PSBJQU0gUk9MRVMgQU5EIFBFUk1JU1NJT05TID09PT09XHJcblxyXG4gICAgLy8gQ29tbW9uIGV4ZWN1dGlvbiByb2xlIGZvciBhbGwgTGFtYmRhIGZ1bmN0aW9uc1xyXG4gICAgY29uc3QgbGFtYmRhRXhlY3V0aW9uUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnQ29kZUNhcHN1bGVMYW1iZGFFeGVjdXRpb25Sb2xlJywge1xyXG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnbGFtYmRhLmFtYXpvbmF3cy5jb20nKSxcclxuICAgICAgZGVzY3JpcHRpb246ICdFeGVjdXRpb24gcm9sZSBmb3IgQ29kZUNhcHN1bGUgTGFtYmRhIGZ1bmN0aW9ucycsXHJcbiAgICAgIG1hbmFnZWRQb2xpY2llczogW1xyXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnc2VydmljZS1yb2xlL0FXU0xhbWJkYUJhc2ljRXhlY3V0aW9uUm9sZScpLFxyXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQVdTWFJheURhZW1vbldyaXRlQWNjZXNzJylcclxuICAgICAgXSxcclxuICAgICAgaW5saW5lUG9saWNpZXM6IHtcclxuICAgICAgICBDb2RlQ2Fwc3VsZVBvbGljeTogbmV3IGlhbS5Qb2xpY3lEb2N1bWVudCh7XHJcbiAgICAgICAgICBzdGF0ZW1lbnRzOiBbXHJcbiAgICAgICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcclxuICAgICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXHJcbiAgICAgICAgICAgICAgYWN0aW9uczogW1xyXG4gICAgICAgICAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nR3JvdXAnLFxyXG4gICAgICAgICAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nU3RyZWFtJyxcclxuICAgICAgICAgICAgICAgICdsb2dzOlB1dExvZ0V2ZW50cydcclxuICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgIHJlc291cmNlczogWydhcm46YXdzOmxvZ3M6KjoqOionXVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgXVxyXG4gICAgICAgIH0pXHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PT09IEFQSSBHQVRFV0FZID09PT09XHJcblxyXG4gICAgLy8gQ3JlYXRlIEFQSSBHYXRld2F5XHJcbiAgICBjb25zdCBhcGkgPSBuZXcgYXBpZ2F0ZXdheS5SZXN0QXBpKHRoaXMsICdDb2RlQ2Fwc3VsZUFQSScsIHtcclxuICAgICAgcmVzdEFwaU5hbWU6ICdDb2RlQ2Fwc3VsZSBFeGVjdXRpb24gQVBJJyxcclxuICAgICAgZGVzY3JpcHRpb246ICdTZXJ2ZXJsZXNzIGNvZGUgZXhlY3V0aW9uIEFQSSBmb3IgQ29kZUNhcHN1bGUgcGxhdGZvcm0nLFxyXG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcclxuICAgICAgICBhbGxvd09yaWdpbnM6IGFwaWdhdGV3YXkuQ29ycy5BTExfT1JJR0lOUyxcclxuICAgICAgICBhbGxvd01ldGhvZHM6IGFwaWdhdGV3YXkuQ29ycy5BTExfTUVUSE9EUyxcclxuICAgICAgICBhbGxvd0hlYWRlcnM6IFsnQ29udGVudC1UeXBlJywgJ0F1dGhvcml6YXRpb24nLCAnWC1SZXF1ZXN0ZWQtV2l0aCddXHJcbiAgICAgIH0sXHJcbiAgICAgIGRlcGxveU9wdGlvbnM6IHtcclxuICAgICAgICBzdGFnZU5hbWU6ICdwcm9kJyxcclxuICAgICAgICB0aHJvdHRsZToge1xyXG4gICAgICAgICAgcmF0ZUxpbWl0OiAxMDAwLFxyXG4gICAgICAgICAgYnVyc3RMaW1pdDogMjAwMFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbG9nZ2luZ0xldmVsOiBhcGlnYXRld2F5Lk1ldGhvZExvZ2dpbmdMZXZlbC5JTkZPLFxyXG4gICAgICAgIGRhdGFUcmFjZUVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgbWV0cmljc0VuYWJsZWQ6IHRydWVcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIGV4ZWN1dGlvbiByZXNvdXJjZVxyXG4gICAgY29uc3QgZXhlY3V0aW9uID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2V4ZWN1dGUnKTtcclxuXHJcbiAgICAvLyBBZGQgbGFuZ3VhZ2Utc3BlY2lmaWMgZW5kcG9pbnRzIHdpdGggTGFtYmRhIGludGVncmF0aW9uc1xyXG4gICAgY29uc3QgcHl0aG9uSW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihweXRob25KdWRnZSwge1xyXG4gICAgICByZXF1ZXN0VGVtcGxhdGVzOiB7ICdhcHBsaWNhdGlvbi9qc29uJzogJ3tcImJvZHlcIjogJGlucHV0Lmpzb24oXCIkXCIpfScgfSxcclxuICAgICAgcHJveHk6IGZhbHNlLFxyXG4gICAgICBpbnRlZ3JhdGlvblJlc3BvbnNlczogW3tcclxuICAgICAgICBzdGF0dXNDb2RlOiAnMjAwJyxcclxuICAgICAgICByZXNwb25zZVBhcmFtZXRlcnM6IHtcclxuICAgICAgICAgICdtZXRob2QucmVzcG9uc2UuaGVhZGVyLkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6IFwiJyonXCJcclxuICAgICAgICB9XHJcbiAgICAgIH1dXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBqc0ludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oanNKdWRnZSwge1xyXG4gICAgICByZXF1ZXN0VGVtcGxhdGVzOiB7ICdhcHBsaWNhdGlvbi9qc29uJzogJ3tcImJvZHlcIjogJGlucHV0Lmpzb24oXCIkXCIpfScgfSxcclxuICAgICAgcHJveHk6IGZhbHNlLFxyXG4gICAgICBpbnRlZ3JhdGlvblJlc3BvbnNlczogW3tcclxuICAgICAgICBzdGF0dXNDb2RlOiAnMjAwJyxcclxuICAgICAgICByZXNwb25zZVBhcmFtZXRlcnM6IHtcclxuICAgICAgICAgICdtZXRob2QucmVzcG9uc2UuaGVhZGVyLkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6IFwiJyonXCJcclxuICAgICAgICB9XHJcbiAgICAgIH1dXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBzcWxJbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHNxbEp1ZGdlLCB7XHJcbiAgICAgIHJlcXVlc3RUZW1wbGF0ZXM6IHsgJ2FwcGxpY2F0aW9uL2pzb24nOiAne1wiYm9keVwiOiAkaW5wdXQuanNvbihcIiRcIil9JyB9LFxyXG4gICAgICBwcm94eTogZmFsc2UsXHJcbiAgICAgIGludGVncmF0aW9uUmVzcG9uc2VzOiBbe1xyXG4gICAgICAgIHN0YXR1c0NvZGU6ICcyMDAnLFxyXG4gICAgICAgIHJlc3BvbnNlUGFyYW1ldGVyczoge1xyXG4gICAgICAgICAgJ21ldGhvZC5yZXNwb25zZS5oZWFkZXIuQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogXCInKidcIlxyXG4gICAgICAgIH1cclxuICAgICAgfV1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGphdmFJbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGphdmFKdWRnZSwge1xyXG4gICAgICByZXF1ZXN0VGVtcGxhdGVzOiB7ICdhcHBsaWNhdGlvbi9qc29uJzogJ3tcImJvZHlcIjogJGlucHV0Lmpzb24oXCIkXCIpfScgfSxcclxuICAgICAgcHJveHk6IGZhbHNlLFxyXG4gICAgICBpbnRlZ3JhdGlvblJlc3BvbnNlczogW3tcclxuICAgICAgICBzdGF0dXNDb2RlOiAnMjAwJyxcclxuICAgICAgICByZXNwb25zZVBhcmFtZXRlcnM6IHtcclxuICAgICAgICAgICdtZXRob2QucmVzcG9uc2UuaGVhZGVyLkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6IFwiJyonXCJcclxuICAgICAgICB9XHJcbiAgICAgIH1dXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBjc2hhcnBJbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGNzaGFycEp1ZGdlLCB7XHJcbiAgICAgIHJlcXVlc3RUZW1wbGF0ZXM6IHsgJ2FwcGxpY2F0aW9uL2pzb24nOiAne1wiYm9keVwiOiAkaW5wdXQuanNvbihcIiRcIil9JyB9LFxyXG4gICAgICBwcm94eTogZmFsc2UsXHJcbiAgICAgIGludGVncmF0aW9uUmVzcG9uc2VzOiBbe1xyXG4gICAgICAgIHN0YXR1c0NvZGU6ICcyMDAnLFxyXG4gICAgICAgIHJlc3BvbnNlUGFyYW1ldGVyczoge1xyXG4gICAgICAgICAgJ21ldGhvZC5yZXNwb25zZS5oZWFkZXIuQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogXCInKidcIlxyXG4gICAgICAgIH1cclxuICAgICAgfV1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGdvSW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihnb0p1ZGdlLCB7XHJcbiAgICAgIHJlcXVlc3RUZW1wbGF0ZXM6IHsgJ2FwcGxpY2F0aW9uL2pzb24nOiAne1wiYm9keVwiOiAkaW5wdXQuanNvbihcIiRcIil9JyB9LFxyXG4gICAgICBwcm94eTogZmFsc2UsXHJcbiAgICAgIGludGVncmF0aW9uUmVzcG9uc2VzOiBbe1xyXG4gICAgICAgIHN0YXR1c0NvZGU6ICcyMDAnLFxyXG4gICAgICAgIHJlc3BvbnNlUGFyYW1ldGVyczoge1xyXG4gICAgICAgICAgJ21ldGhvZC5yZXNwb25zZS5oZWFkZXIuQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogXCInKidcIlxyXG4gICAgICAgIH1cclxuICAgICAgfV1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEFkZCBtZXRob2RzIGZvciBlYWNoIGxhbmd1YWdlXHJcbiAgICBjb25zdCBtZXRob2RPcHRpb25zID0ge1xyXG4gICAgICBtZXRob2RSZXNwb25zZXM6IFt7XHJcbiAgICAgICAgc3RhdHVzQ29kZTogJzIwMCcsXHJcbiAgICAgICAgcmVzcG9uc2VQYXJhbWV0ZXJzOiB7XHJcbiAgICAgICAgICAnbWV0aG9kLnJlc3BvbnNlLmhlYWRlci5BY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiB0cnVlXHJcbiAgICAgICAgfVxyXG4gICAgICB9XVxyXG4gICAgfTtcclxuXHJcbiAgICBleGVjdXRpb24uYWRkUmVzb3VyY2UoJ3B5dGhvbicpLmFkZE1ldGhvZCgnUE9TVCcsIHB5dGhvbkludGVncmF0aW9uLCBtZXRob2RPcHRpb25zKTtcclxuICAgIGV4ZWN1dGlvbi5hZGRSZXNvdXJjZSgnamF2YXNjcmlwdCcpLmFkZE1ldGhvZCgnUE9TVCcsIGpzSW50ZWdyYXRpb24sIG1ldGhvZE9wdGlvbnMpO1xyXG4gICAgZXhlY3V0aW9uLmFkZFJlc291cmNlKCdzcWwnKS5hZGRNZXRob2QoJ1BPU1QnLCBzcWxJbnRlZ3JhdGlvbiwgbWV0aG9kT3B0aW9ucyk7XHJcbiAgICBleGVjdXRpb24uYWRkUmVzb3VyY2UoJ2phdmEnKS5hZGRNZXRob2QoJ1BPU1QnLCBqYXZhSW50ZWdyYXRpb24sIG1ldGhvZE9wdGlvbnMpO1xyXG4gICAgZXhlY3V0aW9uLmFkZFJlc291cmNlKCdjc2hhcnAnKS5hZGRNZXRob2QoJ1BPU1QnLCBjc2hhcnBJbnRlZ3JhdGlvbiwgbWV0aG9kT3B0aW9ucyk7XHJcbiAgICBleGVjdXRpb24uYWRkUmVzb3VyY2UoJ2dvJykuYWRkTWV0aG9kKCdQT1NUJywgZ29JbnRlZ3JhdGlvbiwgbWV0aG9kT3B0aW9ucyk7XHJcblxyXG4gICAgLy8gQWRkIGhlYWx0aCBjaGVjayBlbmRwb2ludFxyXG4gICAgY29uc3QgaGVhbHRoUmVzb3VyY2UgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgnaGVhbHRoJyk7XHJcbiAgICBjb25zdCBoZWFsdGhMYW1iZGEgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdIZWFsdGhDaGVjaycsIHtcclxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXHJcbiAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcclxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUlubGluZShgXHJcbiAgICAgICAgZXhwb3J0cy5oYW5kbGVyID0gYXN5bmMgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKidcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICAgIHN0YXR1czogJ2hlYWx0aHknLFxyXG4gICAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgICAgICAgICAgIHZlcnNpb246ICcxLjAuMCcsXHJcbiAgICAgICAgICAgICAgc2VydmljZXM6IHtcclxuICAgICAgICAgICAgICAgIHB5dGhvbjogJ2F2YWlsYWJsZScsXHJcbiAgICAgICAgICAgICAgICBqYXZhc2NyaXB0OiAnYXZhaWxhYmxlJyxcclxuICAgICAgICAgICAgICAgIHNxbDogJ2F2YWlsYWJsZScsXHJcbiAgICAgICAgICAgICAgICBqYXZhOiAnYXZhaWxhYmxlJyxcclxuICAgICAgICAgICAgICAgIGNzaGFycDogJ2F2YWlsYWJsZScsXHJcbiAgICAgICAgICAgICAgICBnbzogJ2F2YWlsYWJsZSdcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH07XHJcbiAgICAgIGApLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0hlYWx0aCBjaGVjayBlbmRwb2ludCBmb3IgQ29kZUNhcHN1bGUgQVBJJ1xyXG4gICAgfSk7XHJcblxyXG4gICAgaGVhbHRoUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihoZWFsdGhMYW1iZGEpKTtcclxuXHJcbiAgICAvLyA9PT09PSBPVVRQVVRTID09PT09XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FQSUdhdGV3YXlVUkwnLCB7XHJcbiAgICAgIHZhbHVlOiBhcGkudXJsLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0FQSSBHYXRld2F5IFVSTCBmb3IgQ29kZUNhcHN1bGUgZXhlY3V0aW9uIGVuZ2luZScsXHJcbiAgICAgIGV4cG9ydE5hbWU6ICdDb2RlQ2Fwc3VsZUFQSVVSTCdcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdQeXRob25KdWRnZUFybicsIHtcclxuICAgICAgdmFsdWU6IHB5dGhvbkp1ZGdlLmZ1bmN0aW9uQXJuLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ1B5dGhvbiBqdWRnZSBMYW1iZGEgZnVuY3Rpb24gQVJOJ1xyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0phdmFTY3JpcHRKdWRnZUFybicsIHtcclxuICAgICAgdmFsdWU6IGpzSnVkZ2UuZnVuY3Rpb25Bcm4sXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnSmF2YVNjcmlwdCBqdWRnZSBMYW1iZGEgZnVuY3Rpb24gQVJOJ1xyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1NRTEp1ZGdlQXJuJywge1xyXG4gICAgICB2YWx1ZTogc3FsSnVkZ2UuZnVuY3Rpb25Bcm4sXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnU1FMIGp1ZGdlIExhbWJkYSBmdW5jdGlvbiBBUk4nXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnSmF2YUp1ZGdlQXJuJywge1xyXG4gICAgICB2YWx1ZTogamF2YUp1ZGdlLmZ1bmN0aW9uQXJuLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0phdmEganVkZ2UgTGFtYmRhIGZ1bmN0aW9uIEFSTidcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdDU2hhcnBKdWRnZUFybicsIHtcclxuICAgICAgdmFsdWU6IGNzaGFycEp1ZGdlLmZ1bmN0aW9uQXJuLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0MjIGp1ZGdlIExhbWJkYSBmdW5jdGlvbiBBUk4nXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnR29KdWRnZUFybicsIHtcclxuICAgICAgdmFsdWU6IGdvSnVkZ2UuZnVuY3Rpb25Bcm4sXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnR28ganVkZ2UgTGFtYmRhIGZ1bmN0aW9uIEFSTidcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdKYXZhRUNSUmVwb3NpdG9yeScsIHtcclxuICAgICAgdmFsdWU6IGphdmFSZXBvLnJlcG9zaXRvcnlVcmksXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnRUNSIHJlcG9zaXRvcnkgZm9yIEphdmEganVkZ2UgY29udGFpbmVyJ1xyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0NTaGFycEVDUlJlcG9zaXRvcnknLCB7XHJcbiAgICAgIHZhbHVlOiBjc2hhcnBSZXBvLnJlcG9zaXRvcnlVcmksXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnRUNSIHJlcG9zaXRvcnkgZm9yIEMjIGp1ZGdlIGNvbnRhaW5lcidcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdHb0VDUlJlcG9zaXRvcnknLCB7XHJcbiAgICAgIHZhbHVlOiBnb1JlcG8ucmVwb3NpdG9yeVVyaSxcclxuICAgICAgZGVzY3JpcHRpb246ICdFQ1IgcmVwb3NpdG9yeSBmb3IgR28ganVkZ2UgY29udGFpbmVyJ1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gVGFnIGFsbCByZXNvdXJjZXNcclxuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnUHJvamVjdCcsICdDb2RlQ2Fwc3VsZScpO1xyXG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdDb21wb25lbnQnLCAnU2VydmVybGVzc0V4ZWN1dGlvbicpO1xyXG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdFbnZpcm9ubWVudCcsIHByb2Nlc3MuZW52LlNUQUdFIHx8ICdkZXYnKTtcclxuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnTWFuYWdlZEJ5JywgJ0NESycpO1xyXG4gIH1cclxufSJdfQ==