# Stage 1: Build the TanStack Start / Nitro application using Bun
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Install dependencies with Bun using the existing bun.lock
COPY package.json bun.lock bunfig.toml ./
RUN bun install

# Copy application source code
COPY . .

# OAuth client ID is public (identifies the app, not a secret); baked into the client bundle at build time.
# The client secret is never in the image — it is provided at runtime via Cloud Run env vars.
ENV VITE_GOOGLE_CLIENT_ID=131807938624-anh06ij2jpje5e93dk4g4rben0i736p4.apps.googleusercontent.com

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
