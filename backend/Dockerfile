FROM oven/bun:1 AS base

FROM base AS build
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
RUN bun run build

FROM base AS app
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
ENTRYPOINT [ "bun", "start" ]
