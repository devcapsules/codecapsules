# CodeCapsule

AI-powered platform for creating and embedding interactive coding experiences.

## Quick Start

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Build all packages
npm run build

# Run tests
npm run test
```

## Architecture

- **apps/dashboard** - Creator dashboard (Next.js)
- **apps/embed** - Embed widget runtime
- **apps/api** - Serverless API functions
- **packages/core** - Core generation and validation logic
- **packages/ui** - Shared React components
- **packages/database** - Database layer and schemas
- **packages/integrations** - External service integrations
- **packages/utils** - Shared utilities

## Development

This is a Turborepo monorepo. Each package and app has its own README with specific instructions.

## Environment Setup

Copy `.env.example` to `.env.local` and fill in your API keys:

```bash
cp .env.example .env.local
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run `npm run lint` and `npm run type-check`
4. Submit a pull request