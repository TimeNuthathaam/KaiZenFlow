# ==========================================
# Stage 1: Build Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy frontend files
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ==========================================
# Stage 2: Production Server
# ==========================================
FROM node:20-alpine AS production

WORKDIR /app

# Copy backend
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

COPY server/ ./server/

# Copy built frontend
COPY --from=frontend-builder /app/dist ./dist

# Install serve for static files
RUN npm install -g serve

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'cd /app/server && node index.js &' >> /app/start.sh && \
    echo 'serve -s /app/dist -l 80' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 80 3001

CMD ["/app/start.sh"]
