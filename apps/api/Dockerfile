FROM node:24-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
COPY tsconfig.json ./

RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm -C apps/api install

EXPOSE 3000

CMD ["pnpm", "-C", "apps/api", "dev"]