FROM node:22-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@11.24.0 turbo@^2

FROM base AS builder
WORKDIR /app
COPY . .
RUN turbo prune web --docker

FROM base AS installer
WORKDIR /app

# Install dependencies using the pruned lockfile
COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile

# Copy source
COPY --from=builder /app/out/full/ .

FROM installer AS dev
WORKDIR /app
ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV WATCHPACK_POLLING=true
EXPOSE 3000
CMD ["pnpm", "--filter", "web", "dev"]

FROM installer AS builder-prod
RUN pnpm turbo run build --filter=web

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 nextjs

# Copy standalone build and assets
COPY --from=builder-prod --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder-prod --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder-prod --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

CMD ["node", "apps/web/server.js"]
