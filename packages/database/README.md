# Database Package

This package provides the database layer for CodeCapsule using Prisma and Supabase.

## Setup

1. Generate Prisma client:
```bash
pnpm db:generate
```

2. Push schema to database:
```bash
pnpm db:push
```

3. Open Prisma Studio:
```bash
pnpm db:studio
```

## Environment Variables

Required in your `.env`:

```
DATABASE_URL="postgresql://username:password@localhost:5432/codecapsule"
DIRECT_URL="postgresql://username:password@localhost:5432/codecapsule"
```

For Supabase, use:
```
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

## Schema Overview

- **Users**: Creator accounts with tier management
- **Capsules**: Learning content with universal capsule format
- **Executions**: Code execution tracking and metrics  
- **Analytics**: Learning insights and performance data
- **Creator Feedback**: AI training data from human edits
- **Subscriptions**: Business tier and billing management
- **System Metrics**: Platform health and usage tracking

## Usage

```typescript
import { prisma } from '@codecapsule/database'

// Create a new capsule
const capsule = await prisma.capsule.create({
  data: {
    title: "Hello World",
    description: "Learn basic programming",
    type: "CODE",
    difficulty: "EASY",
    content: { /* adaptive content */ },
    runtime: { /* runtime config */ },
    creatorId: userId
  }
})
```