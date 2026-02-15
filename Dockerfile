FROM oven/bun:1.3.9 AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM nginx:stable-alpine
LABEL org.opencontainers.image.source=https://github.com/Winter/label-designer \
      org.opencontainers.image.description="A browser-based label designer for creating and printing custom labels" \
      org.opencontainers.image.licenses=MIT

COPY --from=build /app/build /usr/share/nginx/html