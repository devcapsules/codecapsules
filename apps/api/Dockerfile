FROM node:20-bullseye-slim

WORKDIR /app

# Install OpenSSL for Prisma compatibility
RUN apt-get update -y && apt-get install -y openssl libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json ./
COPY package-lock.json ./

# Install dependencies
RUN npm install --production

# Copy built server files
COPY dist/ ./dist/
COPY prisma/ ./prisma/
COPY .env.production ./

# Install Prisma CLI and generate client
RUN npm install @prisma/client prisma
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Start the comprehensive server
CMD ["node", "dist/apps/api/src/server.js"]