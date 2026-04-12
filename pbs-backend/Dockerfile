FROM node:24-alpine AS builder
WORKDIR /app
RUN npm install -g npm@10.9.0

# Puppeteer optimizations
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_DOWNLOAD=true

# IMPORTANT: lockfile MUST be included
COPY package.json package-lock.json .npmrc ./

# Install dependencies (CI safe)
RUN npm ci

# Prisma setup
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

# Build app
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# Copy PDF assets
RUN cp -r src/modules/pdf/templates dist/src/modules/pdf/templates && \
    cp src/modules/pdf/logo-base64.txt dist/src/modules/pdf/logo-base64.txt


# ─────────────────────────────
# Production Runner
# ─────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app
RUN npm install -g npm@10.9.0

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production

# Install production deps only
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev

# Prisma runtime artifacts
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# App build output
COPY --from=builder /app/dist ./dist

# Prisma runtime files
COPY prisma ./prisma
COPY prisma.config.ts ./

# Entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/docker-entrypoint.sh"]