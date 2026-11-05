# Build from the repo root:  docker build -f apps/api/Dockerfile -t busyfrnd-api .
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY pnpm-workspace.yaml package.json .npmrc tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm install --filter @busyfrnd/api... --filter @busyfrnd/shared...
RUN pnpm --filter @busyfrnd/shared build && pnpm --filter @busyfrnd/api build

FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=build /repo /repo
WORKDIR /repo/apps/api
EXPOSE 4000
# Apply migrations, then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
