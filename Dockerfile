# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application files
COPY . .

# Production stage
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy application files
COPY --from=builder /app/src ./src

# Create non-root user for security
RUN addgroup -S nodejs && adduser -S -D -H -u 1001 -G nodejs botuser

# Change ownership of app directory
RUN chown -R botuser:nodejs /app

# Switch to non-root user
USER botuser

# Expose port (if needed for health checks)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

# Start the application
CMD ["node", "src/index.js"]
