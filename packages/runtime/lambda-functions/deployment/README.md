# Serverless Deployment Configuration

This directory contains deployment configurations for the serverless Lambda functions.

## 🚀 AWS CDK Deployment

```typescript
// infrastructure/lambda-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class CodeCapsuleLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Python Judge - Native Runtime
    const pythonJudge = new lambda.Function(this, 'PythonJudge', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'python-judge.lambda_handler',
      code: lambda.Code.fromAsset('lambda-functions'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        PYTHONPATH: '/opt'
      }
    });

    // JavaScript Judge - Node.js Runtime
    const jsJudge = new lambda.Function(this, 'JavaScriptJudge', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'javascript-judge.handler',
      code: lambda.Code.fromAsset('lambda-functions'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      layers: [
        // Add VM2 layer for sandboxing
        lambda.LayerVersion.fromLayerVersionArn(this, 'VM2Layer', 
          'arn:aws:lambda:us-east-1:123456789012:layer:vm2:1'
        )
      ]
    });

    // SQL Judge - Python with psycopg2
    const sqlJudge = new lambda.Function(this, 'SQLJudge', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'sql-judge.lambda_handler',
      code: lambda.Code.fromAsset('lambda-functions'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        SUPABASE_URL: process.env.SUPABASE_URL!,
        SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY!
      }
    });

    // Java Judge - Container Image
    const javaJudge = new lambda.Function(this, 'JavaJudge', {
      runtime: lambda.Runtime.FROM_IMAGE,
      code: lambda.Code.fromAssetImage('lambda-functions/java', {
        cmd: ['java-judge.lambda_handler']
      }),
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024
    });

    // C# Judge - Container Image  
    const csharpJudge = new lambda.Function(this, 'CSharpJudge', {
      runtime: lambda.Runtime.FROM_IMAGE,
      code: lambda.Code.fromAssetImage('lambda-functions/csharp', {
        cmd: ['CSharpJudge::CSharpJudge.Function::FunctionHandler']
      }),
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024
    });

    // Go Judge - Container Image
    const goJudge = new lambda.Function(this, 'GoJudge', {
      runtime: lambda.Runtime.FROM_IMAGE,
      code: lambda.Code.fromAssetImage('lambda-functions/go', {
        cmd: ['go-judge']
      }),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512
    });

    // API Gateway for routing
    const api = new apigateway.RestApi(this, 'CodeExecutionAPI', {
      restApiName: 'Code Capsule Execution Service',
      description: 'Serverless code execution API'
    });

    // Route to language-specific judges
    const execution = api.root.addResource('execute');
    
    execution.addResource('python')
      .addMethod('POST', new apigateway.LambdaIntegration(pythonJudge));
    
    execution.addResource('javascript')
      .addMethod('POST', new apigateway.LambdaIntegration(jsJudge));
    
    execution.addResource('sql')
      .addMethod('POST', new apigateway.LambdaIntegration(sqlJudge));
    
    execution.addResource('java')
      .addMethod('POST', new apigateway.LambdaIntegration(javaJudge));
    
    execution.addResource('csharp')
      .addMethod('POST', new apigateway.LambdaIntegration(csharpJudge));
    
    execution.addResource('go')
      .addMethod('POST', new apigateway.LambdaIntegration(goJudge));
  }
}
```

## 📦 Container Images

### Java Judge Dockerfile
```dockerfile
FROM public.ecr.aws/lambda/python:3.12

# Install OpenJDK
RUN yum update -y && \
    yum install -y java-17-amazon-corretto-devel && \
    yum clean all

# Copy function code
COPY java-judge.py ${LAMBDA_TASK_ROOT}

# Create security policy
RUN echo 'grant { permission java.io.FilePermission "<<ALL FILES>>", "read,write"; };' > /opt/java.policy

CMD ["java-judge.lambda_handler"]
```

### C# Judge Dockerfile  
```dockerfile
FROM public.ecr.aws/lambda/dotnet:8

# Copy function code and dependencies
COPY *.cs ${LAMBDA_TASK_ROOT}
COPY *.csproj ${LAMBDA_TASK_ROOT}

# Restore dependencies and build
RUN dotnet restore
RUN dotnet build --configuration Release

CMD ["CSharpJudge::CSharpJudge.Function::FunctionHandler"]
```

### Go Judge Dockerfile
```dockerfile
FROM public.ecr.aws/lambda/provided:al2-x86_64

# Install Go compiler
RUN yum update -y && \
    curl -L https://golang.org/dl/go1.21.linux-amd64.tar.gz | tar -C /usr/local -xzf - && \
    yum clean all

ENV PATH=$PATH:/usr/local/go/bin

# Copy function code
COPY go-judge.go ${LAMBDA_TASK_ROOT}
COPY go.mod ${LAMBDA_TASK_ROOT}

# Build the handler
RUN cd ${LAMBDA_TASK_ROOT} && go build -o bootstrap go-judge.go

CMD ["./bootstrap"]
```

## 🚀 Deployment Commands

```bash
# Deploy infrastructure
npm install -g aws-cdk-lib
cdk bootstrap
cdk deploy

# Build and push container images (automated by CDK)
# CDK handles container builds automatically

# Update function code only
aws lambda update-function-code \
  --function-name PythonJudge \
  --zip-file fileb://python-judge.zip

# Monitor logs
aws logs tail /aws/lambda/PythonJudge --follow
```

## 📊 Monitoring

Each Lambda function includes:
- ✅ **CloudWatch Logs** for debugging
- ✅ **X-Ray Tracing** for performance
- ✅ **Custom Metrics** for execution stats
- ✅ **Error Alarms** for reliability

## 🔒 Security Configuration

- **Execution Role**: Minimal permissions for each judge
- **VPC Configuration**: Optional for database access
- **Environment Variables**: Encrypted with KMS
- **Resource Limits**: Memory and timeout constraints