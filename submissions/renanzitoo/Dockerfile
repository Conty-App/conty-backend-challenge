# Multi-stage Dockerfile for pix-batch-service

# Builder stage: install dev deps and build TS
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install all dependencies (including dev)
COPY package*.json ./
RUN npm install

# Copy prisma schema so prisma generate can run during build
COPY prisma ./prisma

# Generate Prisma client for the alpine runtime
RUN npx prisma generate

# Copy rest of the sources and build
COPY . .
RUN npm run build

# Final stage: smaller runtime image with only production deps
FROM node:20-alpine AS runner
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm install --production

# Copy built output and generated prisma client from builder
COPY --from=builder /app/dist ./dist
# The compiled code expects require('../generated/prisma') from files under dist,
# so place the generated client under dist/generated/prisma
COPY --from=builder /app/src/generated/prisma ./dist/generated/prisma

# Copy prisma schema if needed (optional)
# COPY prisma ./prisma

EXPOSE 8080
CMD ["node", "dist/index.js"]
