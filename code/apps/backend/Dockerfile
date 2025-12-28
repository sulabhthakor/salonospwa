FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm --filter @salon/backend build
RUN pnpm --filter @salon/backend deploy --prod /prod/backend

FROM base AS runner
WORKDIR /app
COPY --from=builder /prod/backend /app
CMD [ "node", "dist/main" ]
