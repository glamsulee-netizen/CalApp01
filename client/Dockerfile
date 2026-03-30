# ============================================
# CalApp01 Client — Multi-stage Docker Build
# ============================================

# --- Stage 1: Build ---
FROM node:18-alpine AS builder

WORKDIR /app

ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_VAPID_PUBLIC_KEY

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_VAPID_PUBLIC_KEY=$VITE_VAPID_PUBLIC_KEY

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# --- Stage 2: Serve with Nginx ---
FROM nginx:alpine

# Копируем собранный фронт
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA fallback: все маршруты → index.html
RUN echo 'server { \
  listen 80; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { \
    try_files $uri $uri/ /index.html; \
  } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
