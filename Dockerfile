# Multi-stage Dockerfile for Next.js with Convex

# Stage 1: Dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
RUN npm install -g npm@latest
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:22-alpine AS builder
RUN npm install -g npm@latest
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Accept build arguments from Dokploy
ARG CONVEX_DEPLOY_KEY
ARG CONVEX_URL
ARG NEXT_PUBLIC_CONVEX_URL

# Set environment variables for build (CRITICAL for NEXT_PUBLIC_* vars)
ENV CONVEX_DEPLOY_KEY=$CONVEX_DEPLOY_KEY
ENV CONVEX_URL=$CONVEX_URL
ENV NEXT_PUBLIC_CONVEX_URL=$NEXT_PUBLIC_CONVEX_URL

# Deploy Convex backend (this generates the _generated files)
RUN npx convex deploy --cmd-url-env-var-name CONVEX_URL

# Build Next.js application (now with generated Convex files)
RUN npm run build

# Stage 3: Runner
FROM node:22-alpine AS runner
RUN npm install -g npm@latest
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy Next.js build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Convex configuration and generated files
COPY --from=builder --chown=nextjs:nodejs /app/convex ./convex

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the Next.js application
CMD ["node", "server.js"]
