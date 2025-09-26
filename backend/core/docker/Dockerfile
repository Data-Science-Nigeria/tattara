# Stage 1: Build
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev dependencies for building)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Stage 2: Production
FROM node:20-alpine AS runner

# Install pnpm in production image
RUN npm install -g pnpm

WORKDIR /app

# Add non-root user
RUN addgroup -S app && adduser -S app -G app

# Copy package files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy necessary files for migrations (if needed)
COPY --from=builder /app/ormconfig.js ./

# Change ownership to app user
RUN chown -R app:app /app
USER app

ENV NODE_ENV=production

CMD ["node", "dist/main.js"]