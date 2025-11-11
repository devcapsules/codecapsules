import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
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