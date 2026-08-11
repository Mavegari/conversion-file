# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar monorepo files
COPY pnpm-lock.yaml ./
COPY package.json pnpm-workspace.yaml ./
COPY apps/worker ./apps/worker
COPY packages/shared ./packages/shared
COPY tsconfig.json ./

# Instalar pnpm
RUN npm install -g pnpm

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm -r build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Instalar dumb-init y dependencias del sistema
RUN apk add --no-cache dumb-init libreoffice

# Copiar desde builder
COPY --from=builder /app/apps/worker/dist ./dist
COPY --from=builder /app/apps/worker/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./node_modules/@conversion-file/shared/dist

# Crear directorio de storage
RUN mkdir -p /app/storage

VOLUME ["/app/storage"]

ENV REDIS_HOST=redis
ENV REDIS_PORT=6379
ENV WORKER_CONCURRENCY=4
ENV STORAGE_PATH=/app/storage

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]