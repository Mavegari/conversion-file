FROM node:24-alpine

WORKDIR /app

RUN npm install -g pnpm
RUN apk add --no-cache dumb-init

# Instalar LibreOffice headless
RUN apk add --no-cache \
    libreoffice \
    libreoffice-lang-es

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps/worker ./apps/worker
COPY packages/shared ./packages/shared
COPY tsconfig.json ./

RUN pnpm install --frozen-lockfile --ignore-scripts

RUN mkdir -p /app/storage

ENV REDIS_HOST=redis
ENV REDIS_PORT=6379
ENV WORKER_CONCURRENCY=4
ENV STORAGE_PATH=/app/storage

VOLUME ["/app/storage"]

ENTRYPOINT ["dumb-init", "--"]
CMD ["pnpm", "-C", "apps/worker", "dev"]