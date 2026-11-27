# ============================================================
# repose-web — Next.js 14 App Router  (pnpm workspace · Node 20)
# ============================================================
# The web app is a pnpm workspace: packages/ui and packages/api-types
# must be present before `next build` runs.
#
# Stages
#   base      – Node + pnpm
#   deps      – install all workspace deps
#   dev       – hot-reload (source bind-mounted at runtime)
#   builder   – next build (standalone output)
#   prod      – minimal runtime from .next/standalone
# ============================================================

ARG NODE_VERSION=20

# ── 1. Base ──────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

# ── 2. Deps ───────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/api-types/package.json ./packages/api-types/
RUN pnpm install --frozen-lockfile

# ── 3. Dev ────────────────────────────────────────────────────
FROM base AS dev
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/api-types/package.json ./packages/api-types/
RUN pnpm install --frozen-lockfile
# Source bind-mounted at runtime; this only sets the entrypoint
EXPOSE 4001
CMD ["pnpm", "dev"]

# ── 4. Builder ────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=deps /app/packages/api-types/node_modules ./packages/api-types/node_modules
COPY . .

# Build-time env — values come from docker-compose / CI args
ARG API_BASE_URL=http://localhost:4000/api/v1
ARG SOCKET_URL=http://localhost:4000
ARG SITE_URL=http://localhost:4001
ARG GOOGLE_CLIENT_ID=""
ARG STRIPE_PUBLISHABLE_KEY=""

ENV API_BASE_URL=${API_BASE_URL}
ENV SOCKET_URL=${SOCKET_URL}
ENV SITE_URL=${SITE_URL}
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ENV STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}

# Enable Next.js standalone output (see next.config.mjs note below)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_OUTPUT=standalone
RUN pnpm build

# ── 5. Prod ───────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Standalone output bundles everything needed to run
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 4001
CMD ["node", "server.js"]
