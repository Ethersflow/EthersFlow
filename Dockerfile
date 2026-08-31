# Use the official Node.js 20 LTS slim image as base
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Clean package-lock inside the build image to force fresh, platform-native dependency resolution with overrides
RUN rm -f package-lock.json

# Install all dependencies (including devDependencies for building)
RUN npm install --no-audit --no-fund || (sleep 2 && npm install --no-audit --no-fund)

# Copy the rest of the application files
COPY . .

# Build both client frontend and bundled backend server.ts (using esbuild CJS bundle as configured)
RUN npm run build

# --- Production Runner Layer ---
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy built artifacts and configuration
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

# Clean package-lock in final image and install production dependencies only
RUN rm -f package-lock.json
RUN npm install --only=production --no-audit --no-fund || (sleep 2 && npm install --only=production --no-audit --no-fund)

# Expose the internal port
EXPOSE 8080

# Start the Node.js production CJS server
CMD ["npm", "start"]
