# =============================================================================
# auto-insight Frontend — Next.js 15 (standalone output)
# =============================================================================
# Stage 1: Dependencies & Build
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Ensure public dir exists even if empty (Docker COPY fails on missing dirs)
RUN mkdir -p public

COPY . .

# Build the Next.js standalone bundle (cached for speed)
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/app/.next/cache \
    npm run build

# =============================================================================
# Stage 2: Production runner (minimal image)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy standalone build artifacts
# public/ directory was ensured to exist in builder stage (see above)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
