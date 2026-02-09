FROM oven/bun:1.3 AS base
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

COPY src ./src

EXPOSE 8080
CMD ["bun", "run", "src/index.ts"]
