# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar monorepo files
COPY pnpm-lock.yaml ./
COPY package.json pnpm-workspace.yaml ./
COPY apps/web ./apps/web
COPY tsconfig.json ./

# Instalar pnpm
RUN npm install -g pnpm

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm -C apps/web build

# Runtime stage - Nginx
FROM nginx:alpine

# Copiar configuración de Nginx
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar build desde builder
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]