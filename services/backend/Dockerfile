# ---------------------------------------------------------
# Production Dockerfile for Smart Health Central Backend
# Multi-stage build for minimal image size and fast startup
# ---------------------------------------------------------

# Stage 1: Build TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY smart-health-platform/backend/package*.json ./
RUN npm ci

# Copy backend source code & configs
COPY smart-health-platform/backend/tsconfig.json ./
COPY smart-health-platform/backend/src ./src
COPY smart-health-platform/backend/scripts ./scripts

# Compile TypeScript to JavaScript
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

# Install production dependencies only
COPY smart-health-platform/backend/package*.json ./
RUN npm ci --omit=dev

# Copy compiled JavaScript from builder
COPY --from=builder /app/dist ./dist

# Expose backend port
EXPOSE 8000

# Start server
CMD ["node", "dist/src/index.js"]
