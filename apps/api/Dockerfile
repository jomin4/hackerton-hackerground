FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci --workspace @cheongdo/api --include-workspace-root

COPY apps/api/ apps/api/
COPY packages/shared/ packages/shared/
COPY tsconfig.base.json ./

RUN npm run build -w apps/api

FROM node:22-alpine AS runtime

ARG APP_VERSION=dev
ENV NODE_ENV=production
ENV APP_VERSION=${APP_VERSION}

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci --omit=dev --workspace @cheongdo/api

WORKDIR /app/apps/api

COPY --from=build /app/apps/api/dist ./dist
COPY apps/api/data/spots.json ./data/spots.json

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "--enable-source-maps", "dist/index.js"]
