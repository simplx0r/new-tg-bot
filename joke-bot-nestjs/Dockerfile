# =========================================
# 🕵️ Secret Agent IT Bot - Dockerfile
# Multi-stage build for minimal image size
# =========================================

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Prune devDependencies
RUN npm prune --production

# =========================================
# Stage 2: Production
FROM node:22-alpine AS production

WORKDIR /app

# Install runtime dependencies for better-sqlite3
RUN apk add --no-cache libstdc++

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./

# Create data directory for SQLite
RUN mkdir -p /app/data && chown nestjs:nodejs /app/data

# Switch to non-root user
USER nestjs

# Set environment
ENV NODE_ENV=production

# Expose port (if needed for health checks)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('healthy')" || exit 1

# Run the bot
CMD ["node", "dist/main.js"]
