# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar monorepo files
COPY pnpm-lock.yaml ./
COPY package.json pnpm-workspace.yaml ./
COPY apps/api ./apps/api
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

# Instalar dumb-init para manejar signals correctamente
RUN apk add --no-cache dumb-init

# Copiar desde builder
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./node_modules/@conversion-file/shared/dist

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]