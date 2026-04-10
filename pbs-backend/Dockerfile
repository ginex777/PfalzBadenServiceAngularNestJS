FROM node:22-alpine AS builder
WORKDIR /app

# Puppeteer env (nur Download verhindern)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package*.json ./
COPY .npmrc ./
RUN npm ci

# Prisma generate im builder (wichtig!)
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

# App build — nur Source-Dateien, kein node_modules / dist
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src
RUN npm run build && \
    cp -r src/modules/pdf/templates dist/src/modules/pdf/templates && \
    cp src/modules/pdf/logo-base64.txt dist/src/modules/pdf/logo-base64.txt


# ─────────────────────────────────────────────
# Runner Stage (Production)
# ─────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# System dependencies
RUN apk add --no-cache \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont \
  python3

# Env
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy build output + prisma artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Prisma config als TypeScript — Prisma 7 nutzt eingebautes jiti zum Parsen
# (kompiliertes CommonJS .js kann Prisma 7 nicht laden, .ts funktioniert direkt)
COPY prisma.config.ts ./

# Prisma schema + migrations
COPY prisma ./prisma

# Entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/docker-entrypoint.sh"]