FROM node:24-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps/web ./apps/web
COPY tsconfig.json ./

RUN pnpm install --frozen-lockfile --ignore-scripts

EXPOSE 5173

CMD ["pnpm", "-C", "apps/web", "dev"]