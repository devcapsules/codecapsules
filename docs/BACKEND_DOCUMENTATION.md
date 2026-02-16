# CodeCapsule Backend Documentation

> **Version:** 1.0.0  
> **Last Updated:** February 2026  
> **Platform:** DevCapsules.com

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Infrastructure Components](#2-infrastructure-components)
3. [API Endpoints Reference](#3-api-endpoints-reference)
4. [AI Generation Pipeline](#4-ai-generation-pipeline)
5. [Code Execution System](#5-code-execution-system)
6. [Database Schema](#6-database-schema)
7. [Authentication & Security](#7-authentication--security)
8. [Test Harness System](#8-test-harness-system)
9. [Deployment Guide](#9-deployment-guide)
10. [Environment Variables](#10-environment-variables)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Architecture Overview

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (Vercel)                                 │
│                                                                              │
│   ┌─────────────────────────┐         ┌─────────────────────────┐           │
│   │   apps/dashboard        │         │   apps/embed            │           │
│   │   (devcapsules.com)     │         │   (Embeddable Widget)   │           │
│   │   - Creator Studio      │         │   - Interactive Player  │           │
│   │   - Capsule Editor      │         │   - Embed Code Gen      │           │
│   └───────────┬─────────────┘         └───────────┬─────────────┘           │
│               │                                   │                          │
└───────────────┼───────────────────────────────────┼──────────────────────────┘
                │              HTTPS                │
                └───────────────┬───────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AWS HTTP API Gateway                                      │
│              xbjpi644l4.execute-api.us-east-1.amazonaws.com                  │
│                         (30 second timeout limit)                            │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AWS Lambda Function                                  │
│                       codecapsule-api-dev-api                                │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      Express.js Server                               │   │
│   │                    (apps/api/src/server.ts)                          │   │
│   │                                                                      │   │
│   │   Configuration:                                                     │   │
│   │   • Memory: 3008 MB                                                  │   │
│   │   • Timeout: 29 seconds                                              │   │
│   │   • Runtime: Node.js 18.x                                            │   │
│   │   • Handler: dist/apps/api/src/lambda.handler                        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────┬─────────────────────┬─────────────────────┬──────────────────────┘
           │                     │                     │
           ▼                     ▼                     ▼
┌──────────────────┐   ┌─────────────────┐   ┌────────────────────┐
│   Azure OpenAI   │   │  Upstash Redis  │   │  Neon PostgreSQL   │
│                  │   │     Queue       │   │                    │
│   Endpoint:      │   │                 │   │   Connection:      │
│   devcapsules-   │   │   real-gnu-     │   │   pgbouncer=true   │
│   resource...    │   │   38110.upstash │   │   (connection      │
│                  │   │   .io           │   │    pooling)        │
│   Model: GPT-4o  │   │                 │   │                    │
│   API: 2025-01-  │   │   Used for:     │   │   ORM: Prisma      │
│   01-preview     │   │   Job queuing   │   │                    │
└──────────────────┘   └────────┬────────┘   └────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   EC2 Instance        │
                    │   (Piston Runtime)    │
                    │                       │
                    │   IP: 44.222.105.71   │
                    │   Port: 2000 (internal)│
                    │                       │
                    │   Supported Languages:│
                    │   • Python            │
                    │   • JavaScript        │
                    │   • Java              │
                    │   • C++               │
                    │   • C                 │
                    └───────────────────────┘
```

### Request Flow

1. **Frontend** sends request to API Gateway
2. **API Gateway** routes to Lambda function
3. **Lambda** processes request via Express.js
4. For AI generation: calls **Azure OpenAI** (3-agent pipeline)
5. For code execution: queues job to **Redis**, processed by **EC2 Piston**
6. Data persisted to **PostgreSQL** via Prisma

---

## 2. Infrastructure Components

### 2.1 AWS Lambda (Primary API)

| Property | Value |
|----------|-------|
| **Function Name** | `codecapsule-api-dev-api` |
| **Runtime** | Node.js 18.x |
| **Memory** | 3008 MB |
| **Timeout** | 29 seconds |
| **Region** | us-east-1 |
| **Handler** | `dist/apps/api/src/lambda.handler` |

**Configuration File:** `apps/api/serverless.yml`

### 2.2 AWS HTTP API Gateway

| Property | Value |
|----------|-------|
| **Type** | HTTP API (not REST API) |
| **Timeout** | 30 seconds (hard limit) |
| **URL** | `https://xbjpi644l4.execute-api.us-east-1.amazonaws.com` |
| **CORS** | Enabled for `devcapsules.com`, `localhost:3000` |

### 2.3 Azure OpenAI

| Property | Value |
|----------|-------|
| **Endpoint** | `https://devcapsules-resource.cognitiveservices.azure.com` |
| **Model** | `gpt-4o` |
| **API Version** | `2025-01-01-preview` |
| **Deployment** | `gpt-4o` |

### 2.4 EC2 Piston (Code Execution)

| Property | Value |
|----------|-------|
| **Instance IP** | `44.222.105.71` |
| **Port** | 2000 (internal only) |
| **Queue Worker** | Polls Redis for jobs |
| **Supported Languages** | Python, JavaScript, Java, C++, C |

### 2.5 Upstash Redis

| Property | Value |
|----------|-------|
| **URL** | `https://real-gnu-38110.upstash.io` |
| **Purpose** | Job queue for code execution |
| **Protocol** | REST API (serverless-compatible) |

### 2.6 Neon PostgreSQL

| Property | Value |
|----------|-------|
| **Provider** | Neon (serverless Postgres) |
| **Connection Pooling** | pgbouncer=true |
| **ORM** | Prisma |

---

## 3. API Endpoints Reference

### 3.1 Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1706745600000,
  "version": "1.0.0"
}
```

---

### 3.2 Generate Capsule

```http
POST /api/generate-and-execute
```

Generates an educational capsule using the 3-agent AI pipeline.

**Request Body:**
```json
{
  "prompt": "Create a function to reverse a string",
  "language": "python",
  "difficulty": "medium",
  "type": "code"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | Description of the problem to generate |
| `language` | string | Yes | `python`, `javascript`, `sql`, `java`, `cpp`, `c` |
| `difficulty` | string | No | `easy`, `medium`, `hard` (default: `medium`) |
| `type` | string | No | `code`, `database`, `terminal` (default: `code`) |

**Response:**
```json
{
  "success": true,
  "capsule": {
    "title": "Reverse a String",
    "type": "CODE",
    "language": "python",
    "content": {
      "primary": {
        "code": {
          "wasmVersion": {
            "boilerplate": "def solution(s):\n    pass",
            "solution": "def solution(s):\n    return s[::-1]"
          }
        }
      },
      "testCases": [...]
    }
  },
  "metadata": {
    "generationId": "pipeline_1706745600000",
    "generationTime": 18500
  },
  "qualityScore": 0.87
}
```

**Typical Response Time:** 16-22 seconds

---

### 3.3 Execute Code

```http
POST /api/execute
```

Executes arbitrary code on the Piston runtime.

**Request Body:**
```json
{
  "source_code": "print('Hello World')",
  "language": "python",
  "input": "",
  "time_limit": 10,
  "memory_limit": 128
}
```

**Response:**
```json
{
  "success": true,
  "stdout": "Hello World\n",
  "stderr": "",
  "exit_code": 0,
  "execution_time": 45
}
```

---

### 3.4 Execute Tests (Editor "Run Tests" Button)

```http
POST /api/execute-tests
```

Runs user code against test cases in the editor.

**Request Body:**
```json
{
  "userCode": "def add(a, b):\n    return a + b",
  "testCases": [
    {
      "input": "add(2, 3)",
      "expected": 5,
      "description": "Basic addition"
    }
  ],
  "language": "python",
  "functionName": "add"
}
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "totalTests": 3,
    "passedTests": 3,
    "failedTests": 0,
    "successRate": 100,
    "allPassed": true
  },
  "results": [
    {
      "testCase": 1,
      "description": "Basic addition",
      "passed": true,
      "output": "PASS",
      "executionTime": 120
    }
  ]
}
```

---

### 3.5 Validate Capsule

```http
POST /api/capsules/validate
```

Validates a capsule's reference solution against test cases before publishing.

**Request Body:**
```json
{
  "capsule": {
    "title": "Reverse String",
    "language": "python",
    "content": {
      "primary": {
        "code": {
          "wasmVersion": {
            "solution": "def solution(s):\n    return s[::-1]"
          }
        }
      }
    }
  },
  "testCases": [
    {
      "input_args": ["hello"],
      "expected_output": "olleh",
      "description": "Basic reverse"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "validation": {
    "allTestsPassed": true,
    "passedCount": 3,
    "totalCount": 3,
    "results": [...]
  },
  "readyToPublish": true
}
```

---

### 3.6 Publish Capsule

```http
POST /api/capsules/publish
```

Saves a validated capsule to the database.

**Request Body:**
```json
{
  "capsule": {
    "title": "Reverse String",
    "description": "Learn to reverse strings",
    "type": "CODE",
    "language": "python",
    "content": {...}
  },
  "validated": true,
  "publish": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `capsule` | object | Yes | Full capsule object |
| `validated` | boolean | Yes* | Must be `true` after calling `/validate` |
| `skipValidation` | boolean | No | Set `true` to save as draft without validation |
| `publish` | boolean | No | `true` = published, `false` = draft |

**Response:**
```json
{
  "success": true,
  "capsule": {
    "id": "clx123abc",
    "title": "Reverse String",
    "isPublished": true,
    "createdAt": "2026-02-01T12:00:00.000Z"
  },
  "message": "Capsule published successfully!"
}
```

---

### 3.7 Get Capsules

```http
GET /api/capsules
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Max results (default: 10) |
| `offset` | number | Pagination offset |
| `type` | string | Filter by type |
| `language` | string | Filter by language |

---

### 3.8 Get Capsule by ID

```http
GET /api/capsules/:id
```

---

## 4. AI Generation Pipeline

### 4.1 Three-Agent Architecture

The generation pipeline uses three specialized AI agents working in sequence:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ PEDAGOGIST  │ ──▶ │   CODER     │ ──▶ │  DEBUGGER   │
│   Agent     │     │   Agent     │     │   Agent     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
  Educational         Technical          Enhancement
     Idea            Implementation        & Polish
```

### 4.2 Agent Details

#### Pedagogist Agent
**File:** `packages/core/src/agents/pedagogist-agent.ts`

| Property | Value |
|----------|-------|
| **Purpose** | Generate educational problem ideas |
| **Temperature** | 0.5 |
| **Max Tokens** | 400 |
| **Output** | `CapsuleIdea` with title, description, learning objectives |

#### Coder Agent
**File:** `packages/core/src/agents/coder-agent.ts`

| Property | Value |
|----------|-------|
| **Purpose** | Implement code solution with test cases |
| **Temperature** | 0.2 |
| **Max Tokens** | 1800 |
| **Output** | `BaseCapsule` with boilerplate, solution, tests |

**Enforces LeetCode Pattern:**
- Pure functions with arguments and return values
- No `input()` or interactive code
- Deterministic (no unseeded `random`)

#### Debugger Agent
**File:** `packages/core/src/agents/debugger-agent.ts`

| Property | Value |
|----------|-------|
| **Purpose** | Enhance educational content, add hints |
| **Temperature** | 0.2-0.3 |
| **Max Tokens** | 800-2000 |
| **Output** | Enhanced `BaseCapsule` |

### 4.3 Pipeline Configuration

**File:** `packages/core/src/agents/generation-pipeline.ts`

```typescript
{
  max_generation_attempts: 3,
  enable_quality_gates: true,
  skip_validation: true,  // Validation deferred to publish
  timeout_ms: 60000,
  min_educational_value: 0.7,
  min_technical_quality: 0.8,
  max_debugging_attempts: 3
}
```

---

## 5. Code Execution System

### 5.1 Execution Flow

```
Lambda API
    │
    ▼
┌─────────────────┐
│ Execution Queue │ ──▶ Redis (Upstash)
│ (queue.ts)      │
└─────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Queue Worker   │
                  │  (EC2 Instance) │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │     Piston      │
                  │  (Port 2000)    │
                  └─────────────────┘
```

### 5.2 Queue Service

**File:** `apps/api/src/services/queue.ts`

```typescript
// Synchronous execution (queue + poll)
const result = await queue.executeSync(
  language,    // 'python', 'javascript', etc.
  code,        // Source code string
  input,       // stdin input
  timeout      // Timeout in seconds
);
```

### 5.3 Supported Languages

| Language | Piston Runtime | File Extension |
|----------|----------------|----------------|
| Python | python (3.10) | .py |
| JavaScript | javascript (Node 18) | .js |
| Java | java (OpenJDK 17) | .java |
| C++ | cpp (GCC 11) | .cpp |
| C | c (GCC 11) | .c |
| SQL | SQLite (via Lambda) | .sql |

---

## 6. Database Schema

### 6.1 Core Tables

**File:** `packages/database/prisma/schema.prisma`

#### User
```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  createdAt DateTime  @default(now())
  capsules  Capsule[]
}
```

#### Capsule
```prisma
model Capsule {
  id          String      @id @default(cuid())
  title       String
  description String?
  type        CapsuleType // CODE, DATABASE, TERMINAL
  difficulty  Difficulty  // EASY, MEDIUM, HARD
  language    String
  tags        String[]
  content     Json        // Full capsule content
  runtime     Json?
  pedagogy    Json?
  business    Json?
  creatorId   String
  creator     User        @relation(...)
  isPublished Boolean     @default(false)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}
```

---

## 7. Authentication & Security

### 7.1 CORS Configuration

```typescript
const corsOptions = {
  origin: [
    'https://devcapsules.com',
    'https://www.devcapsules.com',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}
```

### 7.2 Security Headers (Helmet)

```typescript
helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'unsafe-none' },
  contentSecurityPolicy: false
})
```

### 7.3 API Key Security

All sensitive keys stored in environment variables:
- `AZURE_OPENAI_API_KEY`
- `DATABASE_URL`
- `UPSTASH_REDIS_REST_TOKEN`

---

## 8. Test Harness System

### 8.1 Three-Layer Defense Strategy

The test harness uses a 3-layer defense to ensure reliable code execution:

#### Layer 1: Base64 Encoding
**Problem:** Special characters in test data break Python/JS syntax  
**Solution:** Encode all test data as base64

```typescript
// Node.js side
const testDataBase64 = Buffer.from(JSON.stringify(testData)).toString('base64');

// Python side
test_data = json.loads(base64.b64decode(test_data_b64).decode('utf-8'))
```

#### Layer 2: Forced Determinism
**Problem:** Random values make tests unpredictable  
**Solution:** Seed random number generators before user code

```python
# Injected before user code
import random
random.seed(42)
try:
    import numpy as np
    np.random.seed(42)
except ImportError:
    pass
```

#### Layer 3: LeetCode Pattern
**Problem:** Interactive code (`input()`) blocks execution  
**Solution:** Enforce pure functions in AI prompts

```python
# Required structure
def solution(arg1, arg2):
    return result

# Forbidden
input()  # ❌ No user input
print()  # ❌ No print for logic
random.randint()  # ❌ Must accept seed parameter
```

### 8.2 Test Harness Template (Python)

```python
# LAYER 2: Force determinism
import random
import sys
random.seed(42)
try:
    import numpy as np
    np.random.seed(42)
except ImportError:
    pass

# User's solution code here
${solutionCode}

# LAYER 1: Base64 test data
import json
import base64

test_data_b64 = "${testDataBase64}"

try:
    test_data = json.loads(base64.b64decode(test_data_b64).decode('utf-8'))
    args = test_data['input_args']
    expected = test_data['expected_output']
    
    actual = ${functionName}(*args)
    
    if actual != expected:
        print(f'TEST FAILED: Expected {expected}, got {actual}')
        sys.exit(1)
    
    print('TEST_PASSED')
except Exception as error:
    print(f'EXECUTION ERROR: {error}')
    sys.exit(1)
```

---

## 9. Deployment Guide

### 9.1 Prerequisites

- Node.js 18+
- AWS CLI configured
- Serverless Framework installed
- Access to Azure OpenAI, Neon, Upstash accounts

### 9.2 Build Commands

```bash
# Install dependencies
npm install

# Build TypeScript
cd apps/api
npx tsc

# Deploy to AWS
npx serverless deploy

# Deploy with verbose output
npx serverless deploy --verbose
```

### 9.3 Environment Setup

1. Copy `.env.example` to `.env.production`
2. Fill in all required environment variables
3. Ensure EC2 Piston worker is running

### 9.4 Verifying Deployment

```bash
# Health check
curl https://xbjpi644l4.execute-api.us-east-1.amazonaws.com/health

# Test generation
curl -X POST https://xbjpi644l4.execute-api.us-east-1.amazonaws.com/api/generate-and-execute \
  -H "Content-Type: application/json" \
  -d '{"prompt":"reverse a string","language":"python"}'
```

---

## 10. Environment Variables

### 10.1 Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint | `https://xxx.cognitiveservices.azure.com` |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API key | `abc123...` |
| `AZURE_OPENAI_DEPLOYMENT` | Model deployment name | `gpt-4o` |
| `AZURE_OPENAI_API_VERSION` | API version | `2025-01-01-preview` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://...?pgbouncer=true` |
| `UPSTASH_REDIS_REST_URL` | Redis REST URL | `https://xxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth token | `xxx...` |
| `USE_QUEUE_EXECUTION` | Enable Piston queue | `true` |
| `PISTON_URL` | EC2 Piston URL | `http://44.222.105.71:2000` |

### 10.2 Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `LOG_LEVEL` | Logging verbosity | `info` |

---

## 11. Troubleshooting

### 11.1 Common Issues

#### 504 Gateway Timeout
**Cause:** Request exceeds 30-second API Gateway limit  
**Solution:** Generation pipeline optimized to ~16-22 seconds. If timeout persists:
- Check Azure OpenAI response times
- Reduce `max_tokens` in agent configs
- Skip validation during generation (deferred to publish)

#### CORS Errors
**Cause:** Origin not whitelisted  
**Solution:** Add domain to `corsOptions.origin` array in `server.ts`

#### "Prepared statement already exists"
**Cause:** Prisma connection pooling issue with Lambda  
**Solution:** Ensure `?pgbouncer=true` in DATABASE_URL

#### Test Harness Syntax Errors
**Cause:** Special characters breaking Python code  
**Solution:** Base64 encoding (Layer 1) should handle this. If persists, check `testDataBase64` generation.

### 11.2 Logs

```bash
# View Lambda logs
npx serverless logs -f api --tail

# View specific time range
npx serverless logs -f api --startTime 1h
```

### 11.3 EC2 Piston Health

```bash
# Check if Piston is responding (from EC2)
curl http://localhost:2000/api/v2/runtimes

# Check queue worker status
pm2 status
pm2 logs queue-worker
```

---

## Appendix A: File Structure

```
codecapsule/
├── apps/
│   ├── api/                    # Backend Lambda API
│   │   ├── src/
│   │   │   ├── server.ts       # Express server & endpoints
│   │   │   ├── lambda.ts       # Lambda handler
│   │   │   ├── ai-service-adapter.ts
│   │   │   ├── azure-openai-client.ts
│   │   │   └── services/
│   │   │       └── queue.ts    # Redis queue service
│   │   ├── serverless.yml      # Serverless config
│   │   └── package.json
│   ├── dashboard/              # Next.js frontend
│   └── embed/                  # Embeddable widget
├── packages/
│   ├── core/                   # Shared business logic
│   │   └── src/
│   │       ├── agents/
│   │       │   ├── pedagogist-agent.ts
│   │       │   ├── coder-agent.ts
│   │       │   ├── debugger-agent.ts
│   │       │   └── generation-pipeline.ts
│   │       └── types/
│   └── database/               # Prisma schema & queries
│       ├── prisma/
│       │   └── schema.prisma
│       └── src/
│           └── queries/
└── docs/
    └── BACKEND_DOCUMENTATION.md
```

---

## Appendix B: API Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (missing required fields) |
| 401 | Unauthorized |
| 404 | Resource not found |
| 500 | Internal server error |
| 504 | Gateway timeout (>30s) |

---

## Appendix C: Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Feb 2026 | Initial documentation |

---

*This documentation is maintained by the DevCapsules engineering team.*
