# Stage 1: Build the TanStack Start / Nitro application
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json bun.lock* ./
RUN npm install

# Copy application source
COPY . .

# Set Nitro preset to node-server so it produces a standalone Node runtime
ENV NITRO_PRESET=node-server
RUN npm run build

# Stage 2: Minimal Production Image
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy the built output from builder stage
COPY --from=builder /app/.output ./.output

EXPOSE 8080

# Launch the Nitro Node server
CMD ["node", ".output/server/index.mjs"]
