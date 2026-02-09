# ==========================================
# Stage 1: Build Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ==========================================
# Stage 2: Production Server
# ==========================================
FROM node:20-alpine AS production

# Install nginx and supervisor
RUN apk add --no-cache nginx supervisor

WORKDIR /app

# Copy backend
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

COPY server/ ./server/

# Copy built frontend to nginx
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/http.d/default.conf

# Create supervisor config
RUN mkdir -p /etc/supervisor.d
RUN echo '[supervisord]' > /etc/supervisor.d/supervisord.ini && \
    echo 'nodaemon=true' >> /etc/supervisor.d/supervisord.ini && \
    echo '' >> /etc/supervisor.d/supervisord.ini && \
    echo '[program:nginx]' >> /etc/supervisor.d/supervisord.ini && \
    echo 'command=nginx -g "daemon off;"' >> /etc/supervisor.d/supervisord.ini && \
    echo 'autostart=true' >> /etc/supervisor.d/supervisord.ini && \
    echo 'autorestart=true' >> /etc/supervisor.d/supervisord.ini && \
    echo '' >> /etc/supervisor.d/supervisord.ini && \
    echo '[program:backend]' >> /etc/supervisor.d/supervisord.ini && \
    echo 'command=node /app/server/index.js' >> /etc/supervisor.d/supervisord.ini && \
    echo 'directory=/app/server' >> /etc/supervisor.d/supervisord.ini && \
    echo 'autostart=true' >> /etc/supervisor.d/supervisord.ini && \
    echo 'autorestart=true' >> /etc/supervisor.d/supervisord.ini

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor.d/supervisord.ini"]
