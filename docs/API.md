# DevCapsules API Reference

**Base URL:** `https://api.devcapsules.com/api/v1`  
**Protocol:** HTTPS only  
**Content-Type:** `application/json`

---

## Table of Contents

- [Authentication](#authentication)
- [Response Format](#response-format)
- [Rate Limits & Quotas](#rate-limits--quotas)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [Auth](#auth)
  - [Capsules](#capsules)
  - [Execute](#execute)
  - [Generate](#generate)
  - [Courses (Playlists)](#courses-playlists)
  - [Analytics](#analytics)
  - [Mentor (AI Hints)](#mentor-ai-hints)
  - [EdGE (Error Guidance)](#edge-error-guidance)
  - [Payments](#payments)
  - [Vouchers](#vouchers)
- [Plan Tiers](#plan-tiers)
- [Supported Languages](#supported-languages)

---

## Authentication

All authenticated endpoints accept one of two methods:

### Bearer Token (JWT)

```
Authorization: Bearer <jwt_token>
```

Tokens are issued via `POST /auth/login` or `POST /auth/register`. Tokens expire after **7 days**.

### API Key

```
Authorization: Bearer dk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

API keys are prefixed with `dk_` and created via `POST /auth/api-keys`. Keys are shown **once** at creation and cannot be retrieved later.

### Auth Levels

| Level | Description |
|-------|-------------|
| **Public** | No token required |
| **Optional** | Token accepted but not required. Response may include extra data when authenticated |
| **Required** | Token mandatory. Returns `401` without valid credentials |
| **Admin** | Restricted to admin whitelist |

---

## Response Format

All responses follow a consistent envelope:

```json
{
  "success": true,
  "data": { },
  "meta": {
    "requestId": "cf-ray-or-uuid",
    "timestamp": 1719000000000,
    "version": "1.0.0"
  }
}
```

Paginated endpoints add:

```json
{
  "meta": {
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 42
    }
  }
}
```

---

## Rate Limits & Quotas

### Per-Minute (Edge-Level)

Native Cloudflare rate limiting, keyed on user ID (authenticated) or IP (anonymous). GET requests are exempt. Returns `429` when exceeded.

### Monthly Quotas (KV-Based)

Checked before execution; incremented only on success.

| Operation | Free | Creator | Team | Enterprise |
|-----------|------|---------|------|------------|
| Executions | 200 | 10,000 | 100,000 | Unlimited |
| Generations | 5 | 50 | 500 | Unlimited |

**Response Headers:**

```
X-Quota-Limit: 200
X-Quota-Remaining: 195
X-Quota-Type: execution
```

### Body Size Limits

| Route | Max Size |
|-------|----------|
| `/execute`, `/execute/tests` | 100 KB |
| `/generate` | 512 KB |
| All others | 1 MB |

---

## Error Handling

Errors return a structured JSON body:

```json
{
  "success": false,
  "error": "Human-readable message",
  "code": "VALIDATION_ERROR",
  "meta": {
    "requestId": "cf-ray-or-uuid",
    "timestamp": 1719000000000,
    "version": "1.0.0"
  }
}
```

| HTTP Code | Meaning |
|-----------|---------|
| 400 | Bad Request — invalid input or missing fields |
| 401 | Unauthorized — missing or invalid token |
| 403 | Forbidden — insufficient plan or not the resource owner |
| 404 | Not Found |
| 409 | Conflict — duplicate resource |
| 429 | Rate Limited — per-minute or monthly quota exceeded |
| 500 | Internal Server Error |

---

## Endpoints

### Auth

#### Register

```
POST /auth/register
```

**Auth:** Public

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User email |
| `password` | string | Yes | Password |
| `name` | string | No | Display name |

**Response** `201`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "abc123",
      "email": "dev@example.com",
      "name": "Dev",
      "plan": "free"
    },
    "token": "eyJhbGci..."
  }
}
```

---

#### Login

```
POST /auth/login
```

**Auth:** Public

| Field | Type | Required |
|-------|------|----------|
| `email` | string | Yes |
| `password` | string | Yes |

**Response** `200` — Same shape as register.

---

#### Get Current User

```
GET /auth/me
```

**Auth:** Required

**Response** `200`

```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "email": "dev@example.com",
    "name": "Dev",
    "plan": "creator",
    "generation_quota": 50,
    "execution_quota": 10000,
    "created_at": "2025-01-15T10:00:00Z",
    "limits": {
      "capsules": { "current": 12, "limit": 100 }
    }
  }
}
```

---

#### Create API Key

```
POST /auth/api-keys
```

**Auth:** Required

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Key label (default: "API Key") |

**Response** `201`

```json
{
  "success": true,
  "data": {
    "id": "key_id",
    "name": "My Key",
    "key": "dk_a1b2c3d4...",
    "prefix": "dk_a1b2c3d4",
    "createdAt": "2025-01-15T10:00:00Z"
  },
  "warning": "Save this API key! It cannot be retrieved later."
}
```

---

#### List API Keys

```
GET /auth/api-keys
```

**Auth:** Required

**Response** `200`

```json
{
  "success": true,
  "data": [
    {
      "id": "key_id",
      "name": "My Key",
      "key_prefix": "dk_a1b2c3d4",
      "last_used": "2025-06-01T12:00:00Z",
      "is_active": true,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

#### Revoke API Key

```
DELETE /auth/api-keys/:id
```

**Auth:** Required

**Response** `200`

```json
{
  "success": true,
  "message": "API key revoked"
}
```

---

### Capsules

#### List Capsules

```
GET /capsules
```

**Auth:** Public

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| `limit` | int | 20 | Max results |
| `offset` | int | 0 | Pagination offset |
| `language` | string | — | Filter by language |
| `difficulty` | string | — | `EASY`, `MEDIUM`, `HARD` |
| `type` | string | — | `CODE`, `DATABASE`, `TERMINAL` |

**Response** `200`

```json
{
  "success": true,
  "data": [
    {
      "id": "cap_abc",
      "title": "Two Sum",
      "description": "Find two numbers...",
      "type": "CODE",
      "difficulty": "EASY",
      "language": "python",
      "function_name": "two_sum",
      "test_count": 5,
      "has_hints": true,
      "tags": ["arrays", "hashmap"],
      "is_published": true,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "meta": { "pagination": { "limit": 20, "offset": 0, "total": 42 } }
}
```

---

#### List Featured Capsules

```
GET /capsules/featured
```

**Auth:** Public

Same query params and response shape as List Capsules.

---

#### Get Capsule

```
GET /capsules/:id
```

**Auth:** Optional

Returns full capsule detail including `content` JSON (starter code, solution, test cases, hints).

**Response** `200`

```json
{
  "success": true,
  "data": {
    "id": "cap_abc",
    "title": "Two Sum",
    "type": "CODE",
    "difficulty": "EASY",
    "language": "python",
    "content": {
      "starterCode": "def two_sum(nums, target):\n    pass",
      "solution": "def two_sum(nums, target):\n    ...",
      "testCases": [
        {
          "input_args": [[2, 7, 11], 9],
          "expected_output": [0, 1],
          "description": "Basic case"
        }
      ],
      "hints": ["Think about using a hash map"]
    },
    "tags": ["arrays"],
    "is_published": true,
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-16T08:00:00Z"
  },
  "source": "cache"
}
```

---

#### Create Capsule

```
POST /capsules
```

**Auth:** Required

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Capsule title |
| `language` | string | Yes | Programming language |
| `content` | object | Yes | Starter code, solution, test cases, hints |
| `description` | string | No | |
| `type` | string | No | `CODE` (default), `DATABASE`, `TERMINAL` |
| `difficulty` | string | No | `EASY`, `MEDIUM`, `HARD` |
| `tags` | string[] | No | |
| `context` | string | No | Problem context |
| `task` | string | No | Task description |
| `insight` | string | No | Learning insight |

Self-healing validation runs automatically — the capsule solution is executed against test cases via Piston. If tests fail, the system auto-heals up to 2 times.

**Response** `201`

```json
{
  "success": true,
  "data": {
    "id": "cap_xyz",
    "title": "Two Sum",
    "healed": false,
    "healingAttempts": 0
  }
}
```

---

#### Update Capsule

```
PUT /capsules/:id
```

**Auth:** Required (owner only)

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | |
| `description` | string | |
| `difficulty` | string | |
| `content` | object | |
| `tags` | string[] | |
| `isPublished` | boolean | |

**Response** `200`

```json
{
  "success": true,
  "data": { "id": "cap_xyz" }
}
```

---

#### Delete Capsule

```
DELETE /capsules/:id
```

**Auth:** Required (owner only)

**Response** `200`

```json
{
  "success": true,
  "message": "Capsule deleted"
}
```

---

#### Update Tags

```
PATCH /capsules/:id/tags
```

**Auth:** Required (owner only)

| Field | Type | Required |
|-------|------|----------|
| `tags` | string[] | Yes |

**Response** `200`

```json
{
  "success": true,
  "data": { "id": "cap_xyz", "tags": ["arrays", "hashmap"] }
}
```

---

### Execute

Code execution uses a **two-tier architecture**:
- **Edge (sync):** SQL runs directly on Cloudflare D1 — instant response.
- **Piston (async):** Python, JavaScript, Java, C++, C are queued and processed on Azure VMSS sandboxes. Poll for results.

#### Run Code

```
POST /execute
```

**Auth:** Public (rate-limited by IP)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `source_code` | string | Yes | — | Code to execute (max 50 KB) |
| `language` | string | Yes | — | `python`, `javascript`, `java`, `cpp`, `c`, `sql` |
| `input` | string | No | `""` | stdin input |
| `time_limit` | int | No | 10 | Seconds (1–30) |
| `memory_limit` | int | No | 128 | MB |

**Response — SQL (sync)** `200`

```json
{
  "success": true,
  "stdout": "| id | name |\n| 1 | Alice |",
  "stderr": "",
  "exit_code": 0,
  "execution_time": 45,
  "tier": "edge"
}
```

**Response — Piston (async)** `202`

```json
{
  "success": true,
  "jobId": "exec_abc123",
  "status": "queued",
  "statusUrl": "/api/v1/execute/runs/exec_abc123"
}
```

---

#### Run Tests

```
POST /execute/tests
```

**Auth:** Public (rate-limited by IP)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userCode` | string | Yes | Function code |
| `testCases` | array | Yes | Max 5 test cases |
| `language` | string | Yes | Target language |
| `functionName` | string | Yes | Function under test |

Each test case:

| Field | Type | Required |
|-------|------|----------|
| `input_args` | array | Yes |
| `expected_output` | any | Yes |
| `description` | string | No |

**Response — SQL (sync)** `200`

```json
{
  "success": true,
  "summary": {
    "totalTests": 5,
    "passedTests": 4,
    "failedTests": 1,
    "successRate": 80,
    "allPassed": false,
    "totalTime": 150
  },
  "results": [
    {
      "testCase": 1,
      "description": "Basic case",
      "passed": true,
      "output": "[0, 1]",
      "expected": "[0, 1]",
      "executionTime": 30,
      "error": null
    }
  ]
}
```

**Response — Piston (async)** `202` — Same jobId pattern as Run Code.

---

#### Poll Job Status

```
GET /execute/runs/:jobId
```

**Auth:** Public

Uses KV for fast reads with D1 fallback if the job has been pending >3 seconds (eventual consistency protection).

**Response — In Progress** `200`

```json
{
  "success": true,
  "jobId": "exec_abc123",
  "status": "queued",
  "createdAt": 1719000000000
}
```

**Response — Completed (run)** `200`

```json
{
  "success": true,
  "jobId": "exec_abc123",
  "status": "completed",
  "type": "run",
  "result": {
    "success": true,
    "stdout": "Hello World\n",
    "stderr": "",
    "exit_code": 0,
    "execution_time": 1200,
    "tier": "piston"
  }
}
```

**Response — Completed (tests)** `200`

```json
{
  "success": true,
  "jobId": "exec_abc123",
  "status": "completed",
  "type": "tests",
  "testResult": {
    "totalTests": 5,
    "passedTests": 5,
    "failedTests": 0,
    "successRate": 100,
    "allPassed": true,
    "tests": [
      {
        "id": 1,
        "passed": true,
        "output": "[0, 1]",
        "expected": "[0, 1]",
        "error": null
      }
    ]
  }
}
```

**Response — Failed** `200`

```json
{
  "success": false,
  "jobId": "exec_abc123",
  "status": "failed",
  "error": "Piston timeout"
}
```

---

#### Execution Health

```
GET /execute/health
```

**Auth:** None (admin diagnostic)

Returns Piston bridge circuit breaker status and configuration.

```json
{
  "success": true,
  "bridge": {
    "circuit": "closed",
    "consecutiveFailures": 0,
    "totalRequests": 1000,
    "totalSuccesses": 995,
    "totalFailures": 5,
    "totalTimeouts": 2,
    "totalCircuitBreaks": 0
  },
  "config": {
    "requestTimeoutMs": 5000,
    "maxRetries": 3,
    "failureThreshold": 5,
    "resetTimeoutMs": 60000
  }
}
```

---

### Generate

AI-powered capsule generation. Async with progress polling.

#### Start Generation

```
POST /generate
```

**Auth:** Required  
**Quota:** Generation quota consumed

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `prompt` | string | Yes | — | Problem description (max 10 KB) |
| `language` | string | Yes | — | Target language |
| `difficulty` | string | No | `MEDIUM` | `EASY`, `MEDIUM`, `HARD` |
| `skipCache` | boolean | No | `false` | Bypass semantic cache |

Features:
- **Idempotency:** Same user + prompt + language deduplicated for 10 min
- **Semantic cache:** Similar prompts return cached results
- **Circuit breaker:** Trips after 5 consecutive AI failures, resets after 5 min
- **Concurrency cap:** Max 5 concurrent jobs globally; returns `429` if exceeded

**Response** `202`

```json
{
  "success": true,
  "jobId": "gen_1719000000_abc",
  "status": "queued",
  "statusUrl": "/api/v1/generate/gen_1719000000_abc/status",
  "deduplicated": false,
  "fromCache": false,
  "meta": {
    "quota": { "remaining": 4, "limit": 5 }
  }
}
```

If semantic cache hit, `status: "completed"` and `result` is returned inline with `fromCache: true`.

---

#### Poll Generation Status

```
GET /generate/:jobId/status
```

**Auth:** Optional

**Response — In Progress** `200`

```json
{
  "success": true,
  "jobId": "gen_1719000000_abc",
  "status": "in_progress",
  "progress": 45,
  "currentStep": "Generating tests..."
}
```

**Response — Completed** `200`

```json
{
  "success": true,
  "jobId": "gen_1719000000_abc",
  "status": "completed",
  "progress": 100,
  "result": {
    "capsule": {
      "title": "Reverse Linked List",
      "description": "...",
      "language": "python",
      "difficulty": "MEDIUM",
      "code": "def reverse_list(head):\n    ...",
      "tests": [
        {
          "description": "Basic case",
          "input_args": [[1, 2, 3]],
          "expected_output": [3, 2, 1]
        }
      ]
    }
  }
}
```

---

### Courses (Playlists)

Courses are ordered collections of capsules, optionally grouped into modules.

#### List Featured Courses

```
GET /playlists/featured
```

**Auth:** Public

| Query Param | Type | Default |
|-------------|------|---------|
| `language` | string | — |
| `limit` | int | 20 |
| `offset` | int | 0 |

**Response** `200`

```json
{
  "success": true,
  "data": [
    {
      "id": "crs_abc",
      "title": "Python Fundamentals",
      "description": "...",
      "is_public": true,
      "status": "published",
      "total_items": 15,
      "tags": ["python", "beginner"],
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

#### List My Courses

```
GET /playlists
```

**Auth:** Required

| Query Param | Type | Description |
|-------------|------|-------------|
| `search` | string | Title search |
| `status` | string | `draft`, `published`, `archived` |
| `limit` | int | |
| `offset` | int | |

---

#### Get Course

```
GET /playlists/:id
```

**Auth:** Optional

Returns course with all items and modules.

**Response** `200`

```json
{
  "success": true,
  "data": {
    "id": "crs_abc",
    "title": "Python Fundamentals",
    "description": "...",
    "is_public": true,
    "status": "published",
    "total_items": 15,
    "modules": [
      { "id": "mod_1", "title": "Getting Started", "position": 0 }
    ],
    "items": [
      {
        "capsule_id": "cap_abc",
        "title": "Hello World",
        "position": 0,
        "is_gate": false,
        "is_optional": false,
        "module_id": "mod_1"
      }
    ]
  }
}
```

---

#### Get Course (Embed)

```
GET /playlists/:id/embed
```

**Auth:** Public

Same as Get Course, but only the first capsule includes full `content`. Optimized for embed widgets.

---

#### Create Course

```
POST /playlists
```

**Auth:** Required

| Field | Type | Required |
|-------|------|----------|
| `title` | string | Yes |
| `description` | string | No |
| `is_public` | boolean | No |
| `items` | array | No |

---

#### Update Course

```
PUT /playlists/:id
```

**Auth:** Required (owner only)

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | |
| `description` | string | |
| `is_public` | boolean | |
| `items` | array | Full item list with `capsule_id`, `order`, `is_gate`, `is_optional`, `module_id` |

Items are synced transactionally — existing items are upserted, removed items are deleted.

---

#### Delete Course

```
DELETE /playlists/:id
```

**Auth:** Required (owner only)

---

#### Duplicate Course

```
POST /playlists/:id/duplicate
```

**Auth:** Required

**Response** `201`

```json
{
  "success": true,
  "data": { "id": "crs_new", "title": "Python Fundamentals (Copy)" }
}
```

---

#### Publish / Unpublish

```
POST /playlists/:id/publish
```

**Auth:** Required (owner only)

| Field | Type | Description |
|-------|------|-------------|
| `published` | boolean | Toggle publish state |

---

#### Update Course Tags

```
PATCH /playlists/:id/tags
```

**Auth:** Required (owner only)

| Field | Type | Required |
|-------|------|----------|
| `tags` | string[] | Yes |

---

#### Course Analytics

```
GET /playlists/:id/analytics
```

**Auth:** Required (owner only)

**Response** `200`

```json
{
  "success": true,
  "data": {
    "total_views": 500,
    "unique_learners": 120,
    "total_completions": 45,
    "average_completion_rate": 68.5,
    "step_completion_rates": [
      {
        "step": 0,
        "title": "Hello World",
        "learners_reached": 120,
        "learners_completed": 95,
        "completion_rate": 79.2
      }
    ]
  }
}
```

---

#### Get Learner Progress

```
GET /playlists/:id/progress
```

**Auth:** Optional

| Query Param | Type | Description |
|-------------|------|-------------|
| `session_id` | string | Learner session identifier |

**Response** `200`

```json
{
  "success": true,
  "data": {
    "current_step": 3,
    "completed_steps": 3,
    "completion_rate": 60,
    "details": [
      {
        "capsule_id": "cap_abc",
        "position": 0,
        "status": "completed",
        "attempts": 2,
        "best_time": 45,
        "hints_used": 1,
        "completed_at": "2025-06-01T12:00:00Z"
      }
    ]
  }
}
```

---

#### Update Learner Progress

```
POST /playlists/:id/progress
```

**Auth:** Optional

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `capsule_id` | string | Yes | Capsule completed |
| `status` | string | No | `completed`, `in_progress` |
| `session_id` | string | No | Learner session |
| `attempts` | int | No | |
| `best_time` | int | No | Seconds |
| `hints_used` | int | No | |
| `last_code` | string | No | Latest submission |

---

#### Create Module

```
POST /playlists/:id/modules
```

**Auth:** Required (owner only)

| Field | Type | Required |
|-------|------|----------|
| `title` | string | Yes |
| `description` | string | No |
| `position` | int | No |

---

#### Update Module

```
PUT /playlists/:id/modules/:moduleId
```

**Auth:** Required (owner only)

| Field | Type |
|-------|------|
| `title` | string |
| `description` | string |
| `position` | int |

---

#### Delete Module

```
DELETE /playlists/:id/modules/:moduleId
```

**Auth:** Required (owner only)

Capsules in the deleted module are orphaned (module_id set to null), not deleted.

---

#### Reorder Modules

```
PUT /playlists/:id/modules/reorder
```

**Auth:** Required (owner only)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `module_ids` | string[] | Yes | Module IDs in desired order |

---

### Analytics

#### Track Event

```
POST /analytics/track
```

**Auth:** Optional (public for embed)

Accepts a single event or a batch of events.

**Batch format:**

```json
{
  "events": [
    {
      "type": "run_clicked",
      "capsuleId": "cap_abc",
      "sessionId": "sess_xyz",
      "learnerId": "lrn_123",
      "learnerName": "John",
      "metadata": {}
    }
  ]
}
```

**Single format:**

```json
{
  "capsuleId": "cap_abc",
  "eventType": "test_passed",
  "sessionId": "sess_xyz",
  "learnerId": "lrn_123"
}
```

**Event Types:**

| Embed Event | Stored As |
|-------------|-----------|
| `session_started` | `impression` |
| `session_completed` | `completed` |
| `run_clicked` | `run` |
| `test_passed` | `test_pass` |
| `test_failed` | `test_fail` |
| `hint_viewed` | `hint_viewed` |
| `solution_viewed` | `solution_viewed` |
| `abandoned` | `abandoned` |

**Response** `200`

```json
{
  "success": true,
  "tracked": 3
}
```

---

#### Capsule Analytics

```
GET /analytics/capsules/:id
```

**Auth:** Required (capsule owner only)

**Response** `200`

```json
{
  "success": true,
  "data": {
    "capsuleId": "cap_abc",
    "capsuleTitle": "Two Sum",
    "summary": {
      "impressions": 100,
      "total_runs": 45,
      "completion_rate": 65,
      "engagement_rate": 45
    },
    "last24Hours": [
      { "event_type": "run", "count": 10 }
    ],
    "dailyTrends": [
      { "date": "2025-06-01", "impressions": 20, "runs": 12, "passes": 8 }
    ]
  }
}
```

---

#### Creator Dashboard

```
GET /analytics/dashboard
```

**Auth:** Required

```json
{
  "success": true,
  "data": {
    "overview": {
      "total_capsules": 5,
      "published_capsules": 3,
      "total_impressions": 500,
      "total_runs": 250,
      "total_passes": 150
    },
    "capsules": [
      {
        "id": "cap_abc",
        "title": "Two Sum",
        "language": "python",
        "is_published": true,
        "impressions": 100,
        "total_runs": 50,
        "completion_rate": 60
      }
    ]
  }
}
```

---

#### Command Center

```
GET /analytics/command-center
```

**Auth:** Required

Returns a combined view of all metrics in a single request (parallel D1 queries under the hood).

```json
{
  "success": true,
  "data": {
    "metrics": {
      "total_capsules": 10,
      "published_capsules": 7,
      "total_impressions": 1000,
      "total_runs": 600,
      "total_passes": 400,
      "runs_this_month": 150,
      "hints_this_month": 30,
      "edge_interventions": 25
    },
    "recent_capsules": [ ],
    "recent_playlists": [ ]
  }
}
```

---

#### Learner Progress (Per Capsule)

```
GET /analytics/learners/:capsuleId
```

**Auth:** Required (capsule owner only)

```json
{
  "success": true,
  "data": {
    "capsuleId": "cap_abc",
    "learners": [
      {
        "learnerId": "lrn_123",
        "displayName": "John Doe",
        "isAnonymous": false,
        "totalRuns": 5,
        "passes": 3,
        "fails": 2,
        "hintsUsed": 1,
        "status": "passed"
      }
    ],
    "totalLearners": 10
  }
}
```

---

#### Course Learner Progress

```
GET /analytics/course-learners/:playlistId
```

**Auth:** Required (course owner only)

```json
{
  "success": true,
  "data": {
    "playlistId": "crs_abc",
    "learners": [
      {
        "learnerId": "lrn_123",
        "displayName": "John Doe",
        "capsuleProgress": {
          "cap_1": { "passed": true, "attempts": 3 },
          "cap_2": { "passed": false, "attempts": 1 }
        },
        "capsulesPassed": 5,
        "totalCapsules": 10
      }
    ],
    "totalLearners": 25
  }
}
```

---

#### Pro-Tier Dashboard

```
GET /analytics/pro-tier/:userId
```

**Auth:** Required (creator+ plan)

| Query Param | Type | Default | Options |
|-------------|------|---------|---------|
| `range` | string | `30d` | `7d`, `30d`, `90d`, `1y` |

```json
{
  "success": true,
  "metrics": {
    "total_impressions": 5000,
    "overall_engagement_rate": 45.5,
    "overall_completion_rate": 65.3,
    "top_capsules": [ ],
    "funnel_data": {
      "impressions": 5000,
      "runs": 2500,
      "passes": 1630
    }
  }
}
```

---

#### Capsule Deep Dive

```
GET /analytics/capsule-deep-dive/:capsuleId
```

**Auth:** Required (creator+ plan, capsule owner)

Returns pedagogical analysis: failure rates per test case, difficulty distribution, time analysis.

```json
{
  "success": true,
  "data": {
    "total_students": 50,
    "completion_rate": 68,
    "avg_attempts": 3.2,
    "avg_time_to_completion": 12.5,
    "failing_test_cases": [
      {
        "test_name": "Edge case",
        "failure_rate": 45.5,
        "student_count": 10,
        "common_errors": ["IndexError: list index out of range"]
      }
    ],
    "difficulty_analysis": {
      "too_easy": 15,
      "just_right": 60,
      "too_hard": 25
    }
  }
}
```

---

### Mentor (AI Hints)

Progressive AI hints powered by Azure OpenAI (gpt-4o-mini) via Cloudflare Tunnel.

#### Get Hint

```
POST /mentor/hint
```

**Auth:** Required

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `capsuleId` | string | Yes | |
| `userCode` | string | Yes | Current code |
| `language` | string | Yes | |
| `errorMessage` | string | No | Runtime error |
| `attemptNumber` | int | No | Current attempt count |

Hints escalate progressively: **nudge** → **guide** → **reveal**.

**Per-capsule limits by plan:**

| Plan | Hints per Capsule |
|------|-------------------|
| Free | 3 |
| Creator | 10 |
| Enterprise | 50 |

**Response** `200`

```json
{
  "hint": "Consider what happens when the input list is empty",
  "hintLevel": "nudge",
  "hintsUsed": 1,
  "hintsRemaining": 2
}
```

---

#### Hint Status

```
GET /mentor/status/:capsuleId
```

**Auth:** Required

```json
{
  "capsuleId": "cap_abc",
  "hintsUsed": 1,
  "hintsRemaining": 2,
  "maxHints": 3,
  "plan": "free"
}
```

---

#### Hint Feedback

```
POST /mentor/feedback
```

**Auth:** Required

| Field | Type | Required |
|-------|------|----------|
| `capsuleId` | string | Yes |
| `hintLevel` | string | Yes |
| `helpful` | boolean | Yes |
| `solvedAfter` | boolean | Yes |

---

### EdGE (Error Guidance)

Error Guidance Engine — structured explanations for code failures. Two-stage: instant regex classifier, then AI-powered explanation.

#### Get Assistance

```
POST /edge/assist
```

**Auth:** Optional (rate-limited per IP if anonymous, per user if authenticated)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `language` | string | Yes | |
| `studentCode` | string | Yes | Code that failed |
| `stderr` | string | No | Error output |
| `testResults` | object | No | `{ passed, total, results[] }` |
| `problemStatement` | string | No | Original task |
| `difficulty` | string | No | |
| `capsuleId` | string | No | |

**Daily limits by plan:**

| Plan | Explanations/Day |
|------|-------------------|
| Free | 10 |
| Creator | 50 |
| Enterprise | 200 |

**Error Types:** `syntax_error`, `name_error`, `type_error`, `index_error`, `key_error`, `attribute_error`, `import_error`, `value_error`, `zero_division`, `infinite_loop`, `runtime_error`, `logic_error`, `edge_case`, `performance`, `unknown`

**Response** `200`

```json
{
  "errorType": "index_error",
  "hint": "Check your array bounds",
  "fix": "Add a length check before accessing the index",
  "explanation": "Your code tries to access index 5 of a list with only 3 elements",
  "lineNumber": 12,
  "cached": false
}
```

AI responses are cached for 1 hour. Falls back to heuristic-only guidance if AI is unavailable.

---

### Payments

Razorpay integration for Indian Rupee pricing.

#### Create Order

```
POST /payments/create-order
```

**Auth:** Required

| Field | Type | Required | Options |
|-------|------|----------|---------|
| `plan` | string | Yes | `creator`, `team` |

**Plans:**

| Plan | Price | Executions | Generations | Capsules |
|------|-------|------------|-------------|----------|
| Creator | ₹2,499/mo | 10,000 | 50 | Unlimited |
| Team | ₹8,299/mo | 100,000 | 500 | 150 |

**Response** `200`

```json
{
  "success": true,
  "data": {
    "orderId": "order_abc",
    "amount": 249900,
    "currency": "INR",
    "planName": "Creator",
    "keyId": "rzp_xxx",
    "prefill": { "email": "dev@example.com" }
  }
}
```

---

#### Verify Payment

```
POST /payments/verify
```

**Auth:** Required

| Field | Type | Required |
|-------|------|----------|
| `razorpay_order_id` | string | Yes |
| `razorpay_payment_id` | string | Yes |
| `razorpay_signature` | string | Yes |

Signature is verified server-side using HMAC-SHA256 with the Razorpay secret.

**Response** `200`

```json
{
  "success": true,
  "data": {
    "plan": "creator",
    "status": "active",
    "currentPeriodEnd": "2025-07-15T10:00:00Z"
  }
}
```

---

#### Get Subscription

```
GET /payments/subscription
```

**Auth:** Required

```json
{
  "success": true,
  "data": {
    "plan": "creator",
    "subscription": {
      "status": "active",
      "currentPeriodStart": "2025-06-15T10:00:00Z",
      "currentPeriodEnd": "2025-07-15T10:00:00Z",
      "cancelAtPeriodEnd": false
    },
    "quotas": {
      "executions": { "limit": 10000, "used": 1234, "remaining": 8766 },
      "generations": { "limit": 50, "used": 12, "remaining": 38 },
      "capsules": { "limit": -1, "current": 15 }
    }
  }
}
```

---

#### Cancel Subscription

```
POST /payments/cancel
```

**Auth:** Required

```json
{
  "success": true,
  "data": {
    "message": "Subscription will be cancelled at end of billing period",
    "cancelAt": "2025-07-15T10:00:00Z"
  }
}
```

---

#### Payment History

```
GET /payments/history
```

**Auth:** Required

```json
{
  "success": true,
  "data": [
    {
      "orderId": "order_abc",
      "paymentId": "pay_xyz",
      "amount": 249900,
      "currency": "INR",
      "plan": "creator",
      "status": "captured",
      "date": "2025-06-15T10:00:00Z",
      "displayAmount": "₹2,499.00"
    }
  ]
}
```

---

#### Usage

```
GET /payments/usage
```

**Auth:** Required

```json
{
  "success": true,
  "data": {
    "plan": "creator",
    "month": "202506",
    "execution": { "used": 1234, "limit": 10000, "remaining": 8766 },
    "generation": { "used": 12, "limit": 50, "remaining": 38 },
    "capsules": { "count": 15 }
  }
}
```

---

#### Webhook

```
POST /payments/webhook
```

**Auth:** None (verified by `x-razorpay-signature` header)

Handles: `payment.captured`, `payment.failed`, `refund.created`, `refund.processed`.

---

### Vouchers

Admin-managed promotional codes.

#### Create Voucher (Admin)

```
POST /vouchers/admin/create
```

**Auth:** Admin only

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `code` | string | Yes | — | 3–32 chars, uppercase |
| `plan` | string | No | `creator` | Plan to grant |
| `durationDays` | int | No | 90 | 1–365 |
| `maxUses` | int | No | 1 | |
| `note` | string | No | — | Internal note |
| `expiresAt` | string | No | — | ISO date |

---

#### Batch Create (Admin)

```
POST /vouchers/admin/batch
```

**Auth:** Admin only

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prefix` | string | Yes | Code prefix |
| `count` | int | Yes | 1–100 |
| `plan` | string | No | |
| `durationDays` | int | No | |

**Response** `201`

```json
{
  "success": true,
  "data": {
    "created": 10,
    "codes": ["PREFIX_A1B2C3", "PREFIX_D4E5F6"],
    "plan": "creator",
    "durationDays": 90
  }
}
```

---

#### List Vouchers (Admin)

```
GET /vouchers/admin/list
```

**Auth:** Admin only

---

#### Deactivate Voucher (Admin)

```
POST /vouchers/admin/deactivate
```

**Auth:** Admin only

| Field | Type | Required |
|-------|------|----------|
| `code` | string | Yes |

---

#### Redeem Voucher

```
POST /vouchers/redeem
```

**Auth:** Required

| Field | Type | Required |
|-------|------|----------|
| `code` | string | Yes |

**Response** `200`

```json
{
  "success": true,
  "data": {
    "plan": "creator",
    "planLabel": "Creator",
    "grantedUntil": "2025-09-15T10:00:00Z",
    "durationDays": 90
  }
}
```

---

#### Voucher Status

```
GET /vouchers/status
```

**Auth:** Required

```json
{
  "success": true,
  "data": {
    "activeGrants": [
      {
        "plan": "creator",
        "grantedUntil": "2025-09-15T10:00:00Z",
        "daysRemaining": 85
      }
    ]
  }
}
```

---

## Plan Tiers

| Feature | Free | Creator (₹2,499/mo) | Team (₹8,299/mo) | Enterprise |
|---------|------|----------------------|-------------------|------------|
| Capsules | 10 | 100 | Unlimited | Unlimited |
| Executions/mo | 200 | 10,000 | 100,000 | Unlimited |
| Generations/mo | 5 | 50 | 500 | Unlimited |
| Mentor hints/capsule | 3 | 10 | 10 | 50 |
| EdGE explanations/day | 10 | 50 | 50 | 200 |
| Piston concurrency | 2 | 5 | 10 | 25 |
| Analytics | Basic | Pro dashboard | Cohort analytics | Full |

---

## Supported Languages

| Language | Execution Tier | Runtime |
|----------|---------------|---------|
| Python | Piston (async) | CPython |
| JavaScript | Piston (async) | Node.js |
| Java | Piston (async) | OpenJDK |
| C++ | Piston (async) | g++ |
| C | Piston (async) | gcc |
| SQL | Edge (sync) | Cloudflare D1 |

---

## CORS

- **Embed routes** (`/capsules`, `/playlists`, `/execute`, `/edge`): `Access-Control-Allow-Origin: *`
- **Dashboard routes**: Restricted to configured origins, credentials enabled
- **Methods:** GET, POST, PUT, PATCH, DELETE, OPTIONS
- **Headers:** `Content-Type`, `Authorization`, `X-Request-ID`, `X-Client`

---

## Async Job Pattern

Many operations (execution, generation) use an async queue pattern:

1. **Submit** → `POST /execute` or `POST /generate` → returns `jobId` + `statusUrl`
2. **Poll** → `GET /execute/runs/:jobId` or `GET /generate/:jobId/status`
3. **Complete** → Response includes full result when `status: "completed"`

Recommended polling interval: start at 500ms, back off to 2s. Jobs expire from KV after 5 minutes.
