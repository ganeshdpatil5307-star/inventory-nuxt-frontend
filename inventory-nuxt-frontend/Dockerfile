# ---- build ----------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
# No package-lock.json is committed, and `npm ci` aborts without one
# (npm error code EUSAGE). Use `npm ci` when a lockfile exists, otherwise
# fall back to `npm install`.
RUN if [ -f package-lock.json ]; then npm ci; else npm install --no-audit --no-fund; fi

COPY . .
ARG NUXT_PUBLIC_API_BASE
ENV NUXT_PUBLIC_API_BASE=$NUXT_PUBLIC_API_BASE
RUN npm run build

# ---- runtime --------------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

COPY --from=build /app/.output ./.output

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:${PORT}/healthz || exit 1

CMD ["node", ".output/server/index.mjs"]
