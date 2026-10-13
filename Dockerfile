# Stage 1: Build the TanStack Start / Nitro application using Bun
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Install dependencies with Bun using the existing bun.lock
COPY package.json bun.lock bunfig.toml ./
RUN bun install

# Copy application source code
COPY . .

# Set Nitro preset to node-server so it produces a standalone Node.js server
ENV NITRO_PRESET=node-server
RUN bun run build

# Stage 2: Minimal Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy the built standalone server from builder stage
COPY --from=builder /app/.output ./.output

EXPOSE 8080

# Run the Nitro server on Cloud Run's port 8080
CMD ["node", ".output/server/index.mjs"]
