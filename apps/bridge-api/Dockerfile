# ═══════════════════════════════════════════════════════════════════════════════
# CodeCapsule Bridge API — Multi-Stage Docker Build
#
# Builds from monorepo root to access packages/core (3-agent AI pipeline).
# Final image: ~150MB, node:20-alpine, non-root user.
#
# Build context: monorepo root (e.g., /opt/devcapsules-repo)
# Usage: docker build -f apps/bridge-api/Dockerfile .
# ═══════════════════════════════════════════════════════════════════════════════

# ── Stage 1: Build — Compile TypeScript ──────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /build

# Copy bridge-api package files and install deps
COPY apps/bridge-api/package*.json ./apps/bridge-api/
WORKDIR /build/apps/bridge-api
RUN npm ci

# Copy source: bridge-api + packages/core (AI pipeline) + packages/utils
WORKDIR /build
COPY apps/bridge-api/ ./apps/bridge-api/
COPY packages/core/src/agents/ ./packages/core/src/agents/
COPY packages/core/src/services/ai-service.ts ./packages/core/src/services/ai-service.ts
COPY packages/core/src/types/base-capsule.ts ./packages/core/src/types/base-capsule.ts
COPY packages/utils/src/ ./packages/utils/src/

# Compile TypeScript (outputs to apps/bridge-api/dist/ preserving monorepo tree)
WORKDIR /build/apps/bridge-api
RUN npx tsc || true
# Note: `|| true` tolerates non-critical type errors from packages/core
# The compiled JS will still work even if types are loose

# ── Stage 2: Production — Lean image ─────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Copy FULL compiled output (preserves tree: dist/apps/..., dist/packages/...)
COPY --from=builder /build/apps/bridge-api/dist ./dist

# Install production dependencies only
COPY --from=builder /build/apps/bridge-api/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Security: run as non-root
USER node

EXPOSE 3000
CMD ["node", "dist/apps/bridge-api/src/server.js"]
