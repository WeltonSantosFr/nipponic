FROM node:22-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@11.24.0 turbo@^2

FROM base AS builder
WORKDIR /app
COPY . .
RUN turbo prune api --docker

FROM base AS installer
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install dependencies using the pruned lockfile
COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile

# Copy pruned workspace source and compile
COPY --from=builder /app/out/full/ .
RUN pnpm turbo run build --filter=api

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Create non-root user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 nestjs

# Install production runtime dependencies (native bcrypt)
RUN echo '{"type":"module"}' > package.json && \
    npm install --omit=dev bcrypt && \
    chown -R nestjs:nodejs /app

# Copy compiled bundle
COPY --chown=nestjs:nodejs --from=installer /app/apps/api/dist ./dist

USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

CMD ["node", "--dns-result-order=ipv4first", "dist/server.mjs"]
