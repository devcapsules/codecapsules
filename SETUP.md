# Devcapsules Setup Guide

🎉 **Your Devcapsules monorepo has been successfully scaffolded and is building!**

## � Quick Start

### 1. Install Dependencies (DONE ✅)
```bash
cd codecapsule
# We use pnpm for better workspace support
pnpm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your API keys:
# - OpenAI API key
# - Supabase credentials  
# - Judge0 API key
# - Stripe keys
# - Cloudflare tokens
```

### 3. Start Development Services

```bash
# Build all packages first
pnpm run build

# Start all apps in development mode
pnpm run dev

# Or start individual apps:
pnpm --filter @codecapsule/dashboard run dev  # Port 3000
pnpm --filter @codecapsule/embed run dev      # Port 3002  
pnpm --filter @codecapsule/api run dev        # Port 3001
```

### 4. Optional: Start Local Database
```bash
# Start PostgreSQL + Redis with Docker
cd infrastructure/docker
docker-compose -f docker-compose.dev.yml up -d
```

## 🔧 Available Commands

```bash
# Build all packages (✅ Working)
pnpm run build

# Start development mode
pnpm run dev

# Run tests (when implemented)
pnpm run test

# Lint code
pnpm run lint

# Type checking
pnpm run type-check

# Format code
pnpm run format

# Clean builds
pnpm run clean
```

## ✅ **What's Working Right Now:**

- **Monorepo Structure**: Turborepo with pnpm workspaces
- **Package Building**: All packages compile successfully
- **TypeScript**: Full type safety with path mapping
- **Next.js Dashboard**: Production build ready
- **Vite Embed App**: UMD bundle for widget embeds
- **Express API**: TypeScript compilation working
- **Shared Packages**: Core types, utils, integrations

## 🏗️ **Next Steps to Build Features:**

1. **Implement Core Generator**: 
   ```bash
   # Work on packages/core/src/generators/codeGenerator.ts
   # Add OpenAI integration for AI code generation
   ```

2. **Add Database Schema**: 
   ```bash
   # Setup Prisma in packages/database/
   # Add your widget/capsule schema
   ```

3. **Build Dashboard UI**: 
   ```bash
   # Create components in apps/dashboard/src/pages/
   # Widget creation, management, analytics
   ```

4. **Implement Embed Runtime**: 
   ```bash
   # Enhance apps/embed/ with Monaco editor
   # Add code execution with Judge0
   ```

The foundation is **production-ready** and aligned perfectly with your design document! 🚀