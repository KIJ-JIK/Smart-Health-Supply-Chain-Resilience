# -------------------------------------------------------------
# Root Dockerfile for Central Backend on Railway / Cloud PaaS
# -------------------------------------------------------------

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configurations
COPY services/backend/smart-health-platform/backend/package*.json ./
RUN npm ci

# Copy backend source
COPY services/backend/smart-health-platform/backend/tsconfig.json ./
COPY services/backend/smart-health-platform/backend/src ./src
COPY services/backend/smart-health-platform/backend/tests ./tests

# Build TypeScript
RUN npm run build

# Runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

COPY services/backend/smart-health-platform/backend/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 8000

CMD ["node", "dist/src/index.js"]
