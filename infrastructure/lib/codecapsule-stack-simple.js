"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeCapsuleStack = void 0;
const cdk = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const logs = require("aws-cdk-lib/aws-logs");
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
                exclude: ['*.js', '*.go', '*.cs', '*.java', 'deployment/**', 'README.md', 'Dockerfile*']
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
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'javascript-judge.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../../packages/runtime/lambda-functions'), {
                exclude: ['*.py', '*.go', '*.cs', '*.java', 'deployment/**', 'README.md', 'Dockerfile*'],
                bundling: {
                    image: lambda.Runtime.NODEJS_18_X.bundlingImage,
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
            runtime: lambda.Runtime.PYTHON_3_11,
            handler: 'sql-judge.lambda_handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../../packages/runtime/lambda-functions'), {
                exclude: ['*.js', '*.go', '*.cs', '*.java', 'deployment/**', 'README.md', 'Dockerfile*'],
                bundling: {
                    image: lambda.Runtime.PYTHON_3_11.bundlingImage,
                    command: [
                        'bash', '-c',
                        'pip install psycopg2-binary && cp -r . /asset-output/'
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
                loggingLevel: apigateway.MethodLoggingLevel.INFO,
                dataTraceEnabled: true,
                metricsEnabled: true
            }
        });
        // Create execution resource
        const execution = api.root.addResource('execute');
        // Add language-specific endpoints with Lambda integrations
        const pythonIntegration = new apigateway.LambdaIntegration(pythonJudge, {
            proxy: true
        });
        const jsIntegration = new apigateway.LambdaIntegration(jsJudge, {
            proxy: true
        });
        const sqlIntegration = new apigateway.LambdaIntegration(sqlJudge, {
            proxy: true
        });
        // Add methods for each language
        execution.addResource('python').addMethod('POST', pythonIntegration);
        execution.addResource('javascript').addMethod('POST', jsIntegration);
        execution.addResource('sql').addMethod('POST', sqlIntegration);
        // Add health check endpoint
        const healthResource = api.root.addResource('health');
        const healthLambda = new lambda.Function(this, 'HealthCheck', {
            runtime: lambda.Runtime.NODEJS_18_X,
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
                sql: 'available'
              }
            })
          };
        };
      `),
            description: 'Health check endpoint for CodeCapsule API'
        });
        healthResource.addMethod('GET', new apigateway.LambdaIntegration(healthLambda, { proxy: true }));
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
        // Tag all resources
        cdk.Tags.of(this).add('Project', 'CodeCapsule');
        cdk.Tags.of(this).add('Component', 'ServerlessExecution');
        cdk.Tags.of(this).add('Environment', process.env.STAGE || 'dev');
        cdk.Tags.of(this).add('ManagedBy', 'CDK');
    }
}
exports.CodeCapsuleStack = CodeCapsuleStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZWNhcHN1bGUtc3RhY2stc2ltcGxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29kZWNhcHN1bGUtc3RhY2stc2ltcGxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUNuQyxpREFBaUQ7QUFDakQseURBQXlEO0FBRXpELDZDQUE2QztBQUU3Qyw2QkFBNkI7QUFFN0IsTUFBYSxnQkFBaUIsU0FBUSxHQUFHLENBQUMsS0FBSztJQUM3QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLDhDQUE4QztRQUU5QyxnQ0FBZ0M7UUFDaEMsTUFBTSxXQUFXLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDM0QsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsNkJBQTZCO1lBQ3RDLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSx5Q0FBeUMsQ0FBQyxFQUFFO2dCQUMzRixPQUFPLEVBQUUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsZUFBZSxFQUFFLFdBQVcsRUFBRSxhQUFhLENBQUM7YUFDekYsQ0FBQztZQUNGLE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDakMsVUFBVSxFQUFFLEdBQUc7WUFDZixXQUFXLEVBQUU7Z0JBQ1gsVUFBVSxFQUFFLG9DQUFvQztnQkFDaEQsU0FBUyxFQUFFLE1BQU07YUFDbEI7WUFDRCxXQUFXLEVBQUUseUNBQXlDO1lBQ3RELFlBQVksRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVE7WUFDekMsT0FBTyxFQUFFLE1B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SUFBSSxFQUFFLG9CQUFvQixFQUFFO1lBQzVDLEtBQUssRUFBRSxPQUFPLENBQUMsV0FBVztZQUMxQixXQUFXLEVBQUUsc0NBQXNDO1NBQ3BELENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFO1lBQ3JDLEtBQUssRUFBRSxRQUFRLENBQUMsV0FBVztZQUMzQixXQUFXLEVBQUUsK0JBQStCO1NBQzdDLENBQUMsQ0FBQztRQUVILG9CQUFvQjtRQUNwQixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ2hELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUscUJBQXFCLENBQUMsQ0FBQztRQUMxRCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxDQUFDO1FBQ2pFLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDNUMsQ0FBQztDQUNGO0FBbkxELDRDQW1MQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XHJcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcclxuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XHJcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcclxuaW1wb3J0ICogYXMgbG9ncyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbG9ncyc7XHJcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xyXG5cclxuZXhwb3J0IGNsYXNzIENvZGVDYXBzdWxlU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xyXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcclxuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xyXG5cclxuICAgIC8vID09PT09IE5BVElWRSBSVU5USU1FIExBTUJEQSBGVU5DVElPTlMgPT09PT1cclxuXHJcbiAgICAvLyBQeXRob24gSnVkZ2UgLSBOYXRpdmUgUnVudGltZVxyXG4gICAgY29uc3QgcHl0aG9uSnVkZ2UgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdQeXRob25KdWRnZScsIHtcclxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuUFlUSE9OXzNfMTEsXHJcbiAgICAgIGhhbmRsZXI6ICdweXRob24tanVkZ2UubGFtYmRhX2hhbmRsZXInLFxyXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uL3BhY2thZ2VzL3J1bnRpbWUvbGFtYmRhLWZ1bmN0aW9ucycpLCB7XHJcbiAgICAgICAgZXhjbHVkZTogWycqLmpzJywgJyouZ28nLCAnKi5jcycsICcqLmphdmEnLCAnZGVwbG95bWVudC8qKicsICdSRUFETUUubWQnLCAnRG9ja2VyZmlsZSonXVxyXG4gICAgICB9KSxcclxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxyXG4gICAgICBtZW1vcnlTaXplOiA1MTIsXHJcbiAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgUFlUSE9OUEFUSDogJy92YXIvcnVudGltZTovdmFyL3Rhc2s6L29wdC9weXRob24nLFxyXG4gICAgICAgIExPR19MRVZFTDogJ0lORk8nXHJcbiAgICAgIH0sXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29kZUNhcHN1bGUgUHl0aG9uIGNvZGUgZXhlY3V0aW9uIGp1ZGdlJyxcclxuICAgICAgbG9nUmV0ZW50aW9uOiBsb2dzLlJldGVudGlvbkRheXMuT05FX1dFRUssXHJcbiAgICAgIHRyYWNpbmc6IGxhbWJkYS5UcmFjaW5nLkFDVElWRSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEphdmFTY3JpcHQgSnVkZ2UgLSBOb2RlLmpzIFJ1bnRpbWVcclxuICAgIGNvbnN0IGpzSnVkZ2UgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdKYXZhU2NyaXB0SnVkZ2UnLCB7XHJcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxyXG4gICAgICBoYW5kbGVyOiAnamF2YXNjcmlwdC1qdWRnZS5oYW5kbGVyJyxcclxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi9wYWNrYWdlcy9ydW50aW1lL2xhbWJkYS1mdW5jdGlvbnMnKSwge1xyXG4gICAgICAgIGV4Y2x1ZGU6IFsnKi5weScsICcqLmdvJywgJyouY3MnLCAnKi5qYXZhJywgJ2RlcGxveW1lbnQvKionLCAnUkVBRE1FLm1kJywgJ0RvY2tlcmZpbGUqJ10sXHJcbiAgICAgICAgYnVuZGxpbmc6IHtcclxuICAgICAgICAgIGltYWdlOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWC5idW5kbGluZ0ltYWdlLFxyXG4gICAgICAgICAgY29tbWFuZDogW1xyXG4gICAgICAgICAgICAnYmFzaCcsICctYycsXHJcbiAgICAgICAgICAgICducG0gaW5zdGFsbCB2bTIgJiYgY3AgLXIgLiAvYXNzZXQtb3V0cHV0LydcclxuICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICAgIH0pLFxyXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXHJcbiAgICAgIG1lbW9yeVNpemU6IDUxMixcclxuICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICBOT0RFX0VOVjogJ3Byb2R1Y3Rpb24nLFxyXG4gICAgICAgIExPR19MRVZFTDogJ0lORk8nXHJcbiAgICAgIH0sXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29kZUNhcHN1bGUgSmF2YVNjcmlwdCBjb2RlIGV4ZWN1dGlvbiBqdWRnZSB3aXRoIFZNMiBzYW5kYm94aW5nJyxcclxuICAgICAgbG9nUmV0ZW50aW9uOiBsb2dzLlJldGVudGlvbkRheXMuT05FX1dFRUssXHJcbiAgICAgIHRyYWNpbmc6IGxhbWJkYS5UcmFjaW5nLkFDVElWRSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFNRTCBKdWRnZSAtIFB5dGhvbiB3aXRoIHBzeWNvcGcyXHJcbiAgICBjb25zdCBzcWxKdWRnZSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ1NRTEp1ZGdlJywge1xyXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5QWVRIT05fM18xMSxcclxuICAgICAgaGFuZGxlcjogJ3NxbC1qdWRnZS5sYW1iZGFfaGFuZGxlcicsXHJcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vcGFja2FnZXMvcnVudGltZS9sYW1iZGEtZnVuY3Rpb25zJyksIHtcclxuICAgICAgICBleGNsdWRlOiBbJyouanMnLCAnKi5nbycsICcqLmNzJywgJyouamF2YScsICdkZXBsb3ltZW50LyoqJywgJ1JFQURNRS5tZCcsICdEb2NrZXJmaWxlKiddLFxyXG4gICAgICAgIGJ1bmRsaW5nOiB7XHJcbiAgICAgICAgICBpbWFnZTogbGFtYmRhLlJ1bnRpbWUuUFlUSE9OXzNfMTEuYnVuZGxpbmdJbWFnZSxcclxuICAgICAgICAgIGNvbW1hbmQ6IFtcclxuICAgICAgICAgICAgJ2Jhc2gnLCAnLWMnLFxyXG4gICAgICAgICAgICAncGlwIGluc3RhbGwgcHN5Y29wZzItYmluYXJ5ICYmIGNwIC1yIC4gL2Fzc2V0LW91dHB1dC8nXHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgICB9KSxcclxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxyXG4gICAgICBtZW1vcnlTaXplOiAyNTYsXHJcbiAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgU1VQQUJBU0VfVVJMOiBwcm9jZXNzLmVudi5TVVBBQkFTRV9VUkwgfHwgJycsXHJcbiAgICAgICAgU1VQQUJBU0VfU0VSVklDRV9LRVk6IHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfS0VZIHx8ICcnLFxyXG4gICAgICAgIERCX0hPU1Q6IHByb2Nlc3MuZW52LkRCX0hPU1QgfHwgJycsXHJcbiAgICAgICAgREJfTkFNRTogcHJvY2Vzcy5lbnYuREJfTkFNRSB8fCAncG9zdGdyZXMnLFxyXG4gICAgICAgIERCX1VTRVI6IHByb2Nlc3MuZW52LkRCX1VTRVIgfHwgJ3JlYWRvbmx5X3VzZXInLFxyXG4gICAgICAgIERCX1BBU1NXT1JEOiBwcm9jZXNzLmVudi5EQl9QQVNTV09SRCB8fCAnJyxcclxuICAgICAgICBQWVRIT05QQVRIOiAnL3Zhci9ydW50aW1lOi92YXIvdGFzazovb3B0L3B5dGhvbidcclxuICAgICAgfSxcclxuICAgICAgZGVzY3JpcHRpb246ICdDb2RlQ2Fwc3VsZSBTUUwgcXVlcnkgZXhlY3V0aW9uIGp1ZGdlIHdpdGggU3VwYWJhc2UgaW50ZWdyYXRpb24nLFxyXG4gICAgICBsb2dSZXRlbnRpb246IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfV0VFSyxcclxuICAgICAgdHJhY2luZzogbGFtYmRhLlRyYWNpbmcuQUNUSVZFLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT0gQVBJIEdBVEVXQVkgPT09PT1cclxuXHJcbiAgICAvLyBDcmVhdGUgQVBJIEdhdGV3YXlcclxuICAgIGNvbnN0IGFwaSA9IG5ldyBhcGlnYXRld2F5LlJlc3RBcGkodGhpcywgJ0NvZGVDYXBzdWxlQVBJJywge1xyXG4gICAgICByZXN0QXBpTmFtZTogJ0NvZGVDYXBzdWxlIEV4ZWN1dGlvbiBBUEknLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ1NlcnZlcmxlc3MgY29kZSBleGVjdXRpb24gQVBJIGZvciBDb2RlQ2Fwc3VsZSBwbGF0Zm9ybScsXHJcbiAgICAgIGRlZmF1bHRDb3JzUHJlZmxpZ2h0T3B0aW9uczoge1xyXG4gICAgICAgIGFsbG93T3JpZ2luczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9PUklHSU5TLFxyXG4gICAgICAgIGFsbG93TWV0aG9kczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9NRVRIT0RTLFxyXG4gICAgICAgIGFsbG93SGVhZGVyczogWydDb250ZW50LVR5cGUnLCAnQXV0aG9yaXphdGlvbicsICdYLVJlcXVlc3RlZC1XaXRoJ11cclxuICAgICAgfSxcclxuICAgICAgZGVwbG95T3B0aW9uczoge1xyXG4gICAgICAgIHN0YWdlTmFtZTogJ3Byb2QnLFxyXG4gICAgICAgIGxvZ2dpbmdMZXZlbDogYXBpZ2F0ZXdheS5NZXRob2RMb2dnaW5nTGV2ZWwuSU5GTyxcclxuICAgICAgICBkYXRhVHJhY2VFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIG1ldHJpY3NFbmFibGVkOiB0cnVlXHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENyZWF0ZSBleGVjdXRpb24gcmVzb3VyY2VcclxuICAgIGNvbnN0IGV4ZWN1dGlvbiA9IGFwaS5yb290LmFkZFJlc291cmNlKCdleGVjdXRlJyk7XHJcblxyXG4gICAgLy8gQWRkIGxhbmd1YWdlLXNwZWNpZmljIGVuZHBvaW50cyB3aXRoIExhbWJkYSBpbnRlZ3JhdGlvbnNcclxuICAgIGNvbnN0IHB5dGhvbkludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24ocHl0aG9uSnVkZ2UsIHtcclxuICAgICAgcHJveHk6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGpzSW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihqc0p1ZGdlLCB7XHJcbiAgICAgIHByb3h5OiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBzcWxJbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHNxbEp1ZGdlLCB7XHJcbiAgICAgIHByb3h5OiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBBZGQgbWV0aG9kcyBmb3IgZWFjaCBsYW5ndWFnZVxyXG4gICAgZXhlY3V0aW9uLmFkZFJlc291cmNlKCdweXRob24nKS5hZGRNZXRob2QoJ1BPU1QnLCBweXRob25JbnRlZ3JhdGlvbik7XHJcbiAgICBleGVjdXRpb24uYWRkUmVzb3VyY2UoJ2phdmFzY3JpcHQnKS5hZGRNZXRob2QoJ1BPU1QnLCBqc0ludGVncmF0aW9uKTtcclxuICAgIGV4ZWN1dGlvbi5hZGRSZXNvdXJjZSgnc3FsJykuYWRkTWV0aG9kKCdQT1NUJywgc3FsSW50ZWdyYXRpb24pO1xyXG5cclxuICAgIC8vIEFkZCBoZWFsdGggY2hlY2sgZW5kcG9pbnRcclxuICAgIGNvbnN0IGhlYWx0aFJlc291cmNlID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2hlYWx0aCcpO1xyXG4gICAgY29uc3QgaGVhbHRoTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnSGVhbHRoQ2hlY2snLCB7XHJcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxyXG4gICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXHJcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21JbmxpbmUoYFxyXG4gICAgICAgIGV4cG9ydHMuaGFuZGxlciA9IGFzeW5jIChldmVudCkgPT4ge1xyXG4gICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxyXG4gICAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgICBzdGF0dXM6ICdoZWFsdGh5JyxcclxuICAgICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgICAgICAgICAgICB2ZXJzaW9uOiAnMS4wLjAnLFxyXG4gICAgICAgICAgICAgIHNlcnZpY2VzOiB7XHJcbiAgICAgICAgICAgICAgICBweXRob246ICdhdmFpbGFibGUnLFxyXG4gICAgICAgICAgICAgICAgamF2YXNjcmlwdDogJ2F2YWlsYWJsZScsXHJcbiAgICAgICAgICAgICAgICBzcWw6ICdhdmFpbGFibGUnXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9O1xyXG4gICAgICBgKSxcclxuICAgICAgZGVzY3JpcHRpb246ICdIZWFsdGggY2hlY2sgZW5kcG9pbnQgZm9yIENvZGVDYXBzdWxlIEFQSSdcclxuICAgIH0pO1xyXG5cclxuICAgIGhlYWx0aFJlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oaGVhbHRoTGFtYmRhLCB7IHByb3h5OiB0cnVlIH0pKTtcclxuXHJcbiAgICAvLyA9PT09PSBPVVRQVVRTID09PT09XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FQSUdhdGV3YXlVUkwnLCB7XHJcbiAgICAgIHZhbHVlOiBhcGkudXJsLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0FQSSBHYXRld2F5IFVSTCBmb3IgQ29kZUNhcHN1bGUgZXhlY3V0aW9uIGVuZ2luZScsXHJcbiAgICAgIGV4cG9ydE5hbWU6ICdDb2RlQ2Fwc3VsZUFQSVVSTCdcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdQeXRob25KdWRnZUFybicsIHtcclxuICAgICAgdmFsdWU6IHB5dGhvbkp1ZGdlLmZ1bmN0aW9uQXJuLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ1B5dGhvbiBqdWRnZSBMYW1iZGEgZnVuY3Rpb24gQVJOJ1xyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0phdmFTY3JpcHRKdWRnZUFybicsIHtcclxuICAgICAgdmFsdWU6IGpzSnVkZ2UuZnVuY3Rpb25Bcm4sXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnSmF2YVNjcmlwdCBqdWRnZSBMYW1iZGEgZnVuY3Rpb24gQVJOJ1xyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1NRTEp1ZGdlQXJuJywge1xyXG4gICAgICB2YWx1ZTogc3FsSnVkZ2UuZnVuY3Rpb25Bcm4sXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnU1FMIGp1ZGdlIExhbWJkYSBmdW5jdGlvbiBBUk4nXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBUYWcgYWxsIHJlc291cmNlc1xyXG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdQcm9qZWN0JywgJ0NvZGVDYXBzdWxlJyk7XHJcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ0NvbXBvbmVudCcsICdTZXJ2ZXJsZXNzRXhlY3V0aW9uJyk7XHJcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ0Vudmlyb25tZW50JywgcHJvY2Vzcy5lbnYuU1RBR0UgfHwgJ2RldicpO1xyXG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdNYW5hZ2VkQnknLCAnQ0RLJyk7XHJcbiAgfVxyXG59Il19