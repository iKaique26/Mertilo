# Use Node.js LTS as base image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY resources/app/package.json ./resources/app/
COPY resources/app/api/package.json ./resources/app/api/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the TypeScript backend
RUN cd resources/app/api && npm run build

# Build the frontend (if needed) - assuming assets already built
# If you have a build step for frontend, add it here.
# For now, we assume the frontend is already built and placed in resources/app/dist

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy only what's needed from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/resources/app ./resources/app
COPY --from=builder /app/resources/app/api ./resources/app/api
COPY --from=builder /app/resources/app/dist ./resources/app/dist
COPY --from=builder /app/resources/app/api/dist ./resources/app/api/dist
COPY --from=builder /app/resources/app/api/data ./resources/app/api/data
COPY --from=builder /app/resources/app/electron ./resources/app/electron

# Expose port for API (if needed)
EXPOSE 5000

# Start the Electron app
CMD ["npx", "electron", "resources/app/electron/main.js"]
