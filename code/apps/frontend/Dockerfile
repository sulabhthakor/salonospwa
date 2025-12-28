FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm --filter @salon/frontend build
RUN pnpm --filter @salon/frontend deploy --prod /prod/frontend

FROM base AS runner
WORKDIR /app
COPY --from=builder /prod/frontend /app
CMD [ "npm", "start" ]
