import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

export class CodeCapsuleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
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