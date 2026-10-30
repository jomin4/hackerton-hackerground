FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci --workspace @cheongdo/web --include-workspace-root

COPY apps/web/ apps/web/
COPY packages/shared/ packages/shared/
COPY tsconfig.base.json ./

RUN npm run build -w apps/web

FROM nginx:alpine AS runtime

COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY infra/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
