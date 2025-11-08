# Multi-stage Dockerfile for Next.js with Convex using Bun

# Stage 1: Dependencies
FROM oven/bun:1.3.2-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files (leverage Docker cache)
COPY package.json bun.lockb* ./

# Install dependencies with cache mount for faster rebuilds
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Stage 2: Builder
FROM oven/bun:1.3.2-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all files (development phase - structure changing frequently)
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Accept build arguments from Dokploy
ARG CONVEX_DEPLOY_KEY
ARG NEXT_PUBLIC_CONVEX_URL

# Set environment variables for build (CRITICAL for NEXT_PUBLIC_* vars)
ENV CONVEX_DEPLOY_KEY=$CONVEX_DEPLOY_KEY
ENV NEXT_PUBLIC_CONVEX_URL=$NEXT_PUBLIC_CONVEX_URL

# Deploy Convex backend and build in one layer
RUN bunx convex deploy && \
    bun run build

# Stage 3: Runner
FROM oven/bun:1.3.2-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user in one RUN command
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir .next && \
    chown nextjs:nodejs .next

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy Next.js build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Convex configuration and generated files
COPY --from=builder --chown=nextjs:nodejs /app/convex ./convex

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the Next.js application with Bun
CMD ["bun", "server.js"]