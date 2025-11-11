# Serverless Lambda Functions - Judge0 Replacement

This directory contains AWS Lambda functions that implement the "Serverless Function as Sandbox" architecture, completely replacing the need for Judge0.

## 🚀 Architecture Overview

Instead of running a 24/7 Judge0 server that burns through AWS credits, each language gets its own Lambda function:

- **Python Judge**: Native Python 3.12 runtime with restricted globals
- **JavaScript Judge**: Node.js 20.x with VM2 sandboxing  
- **SQL Judge**: Python with psycopg2 + Supabase read-only access
- **Java Judge**: Container image with OpenJDK + compilation
- **C# Judge**: .NET 8 runtime with compilation
- **Go Judge**: Container image with Go compiler

## 💰 Cost Benefits

| Architecture | 0 Users | 1000 Users | Scaling |
|--------------|---------|------------|---------|
| **Judge0 VM** | $50-100/month | $200+/month | Manual |
| **Serverless** | $0.00/month | $2-5/month | Automatic |

**Result**: Your $2K AWS credits last 18+ months instead of 3-6 months.

## 🛡️ Security Model

Each execution gets a **fresh microVM** that is:
- ✅ **Network isolated** (no internet access)
- ✅ **Process isolated** (containerized) 
- ✅ **Memory limited** (configurable limits)
- ✅ **Time limited** (automatic timeouts)
- ✅ **Completely destroyed** after execution

This is **more secure** than Judge0 because there's zero risk of cross-execution contamination.

## 📦 Deployment Structure

```
lambda-functions/
├── python-judge.py      # Python execution
├── javascript-judge.js  # Node.js execution  
├── sql-judge.py        # SQL + Supabase
├── java-judge/         # Java compilation + execution
├── csharp-judge/       # C# compilation + execution
└── go-judge/           # Go compilation + execution
```

## 🔧 Local Development

Each function can be tested locally:

```bash
# Test Python judge
python python-judge.py

# Test JavaScript judge  
node javascript-judge.js

# Test SQL judge (requires DB config)
python sql-judge.py
```

## 🚀 Production Deployment

Deploy using AWS CDK/CloudFormation:

1. **Native Runtime Functions** (Python, JavaScript, C#):
   - Deploy as standard Lambda functions
   - No containers needed

2. **Container Functions** (Java, Go):
   - Build Docker images with compilers
   - Deploy using Lambda Container Image support
   - Still serverless and scales to zero

3. **SQL Function**:
   - Requires Supabase connection details in environment variables
   - Uses dedicated read-only database user

## 🎯 Integration

The serverless execution engine automatically routes to appropriate Lambda functions based on language:

```typescript
// Automatic routing
const result = await executeServerlessCode(
  "print('Hello World')", 
  'python'
);

// Routes to python-judge Lambda function
// Returns standardized execution result
```

This replaces Judge0 entirely while being more scalable, secure, and cost-effective.