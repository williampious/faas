# Stage 1: Build the Next.js application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
# Copy package.json and package-lock.json (or yarn.lock if you use yarn)
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js application
# This will use the `output: 'standalone'` configuration from next.config.ts
RUN npm run build

# Stage 2: Production image
# Use a lean Node.js image
FROM node:20-alpine AS production

WORKDIR /app

# Set the NODE_ENV to production
ENV NODE_ENV=production
# Expose port 3000 (default for Next.js)
# Cloud Run will automatically use the PORT environment variable it provides.
EXPOSE 3000

# Copy the standalone Next.js output from the builder stage
COPY --from=builder /app/.next/standalone ./
# Copy the public folder from the builder stage
COPY --from=builder /app/public ./public
# Copy the static assets from .next/static (needed for serving optimized images, fonts, etc.)
COPY --from=builder /app/.next/static ./.next/static

# Start the Next.js application using the server.js from the standalone output
CMD ["node", "server.js"]
