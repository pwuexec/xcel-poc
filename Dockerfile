# Multi-stage Dockerfile for Next.js with Convex

# Stage 1: Dependencies
FROM node:24-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
# Use cache mount for faster installs
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Stage 2: Builder
FROM node:24-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy only necessary files for build (convex config, next config, etc.)
COPY convex ./convex
COPY next.config.ts tsconfig.json ./
COPY app ./app
COPY components ./components
COPY hooks ./hooks
COPY lib ./lib
COPY providers ./providers
COPY public ./public
COPY package.json ./
COPY *.config.* ./

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Accept build arguments from Dokploy
ARG CONVEX_DEPLOY_KEY
ARG CONVEX_URL
ARG NEXT_PUBLIC_CONVEX_URL
ARG CONVEX_SITE_URL

# Set environment variables for build (CRITICAL for NEXT_PUBLIC_* vars)
ENV CONVEX_DEPLOY_KEY=$CONVEX_DEPLOY_KEY
ENV CONVEX_URL=$CONVEX_URL
ENV NEXT_PUBLIC_CONVEX_URL=$NEXT_PUBLIC_CONVEX_URL
ENV CONVEX_SITE_URL=$CONVEX_SITE_URL

# Deploy Convex backend and build in one layer
RUN npx convex deploy --cmd-url-env-var-name CONVEX_URL && \
    npm run build

# Stage 3: Runner
FROM node:24-alpine AS runner
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

# Runtime environment variables need to be available
# These will be injected at runtime by Dokploy
ARG CONVEX_SITE_URL
ARG NEXT_PUBLIC_CONVEX_URL
ARG NEXT_PUBLIC_APP_URL

ENV CONVEX_SITE_URL=$CONVEX_SITE_URL
ENV NEXT_PUBLIC_CONVEX_URL=$NEXT_PUBLIC_CONVEX_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Start the Next.js application
CMD ["node", "server.js"]
