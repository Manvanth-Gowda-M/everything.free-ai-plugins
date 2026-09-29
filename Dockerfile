# ==============================================================================
# Everything.Free AI Plugins — Production Multi-Stage Dockerfile
# ==============================================================================

# --- Stage 1: Build & Compile ---
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies deterministically
COPY package*.json ./
RUN npm ci

# Copy source code and build config
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript to dist/
RUN npm run build

# Remove development dependencies
RUN npm prune --omit=dev

# --- Stage 2: Minimal Production Runtime ---
FROM node:22-alpine AS runner

WORKDIR /app

# Safe production environment defaults
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Copy only production dependencies, compiled artifacts, and licenses
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY README.md LICENSE ./

# Run as unprivileged non-root user
USER node

# Expose Streamable HTTP MCP port
EXPOSE 3000

# Native Node.js health check verifying /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Start the unified Everything.Free MCP server
CMD ["node", "dist/server.js"]
