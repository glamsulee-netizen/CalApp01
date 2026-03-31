# ============================================
# CalApp01 Server — Multi-stage Docker Build
# ============================================

# --- Stage 1: Build ---
FROM node:18-alpine AS builder

RUN apk add --no-cache openssl
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --legacy-peer-deps
RUN npx prisma generate

# Копируем исходники и собираем
COPY tsconfig.json ./
COPY src ./src/

RUN npm run build
RUN npm prune --omit=dev --legacy-peer-deps

# --- Stage 2: Production ---
FROM node:18-alpine AS production

RUN apk add --no-cache openssl
WORKDIR /app

# Копируем только необходимое
COPY package*.json ./
COPY prisma ./prisma/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Создаём директорию для загрузок
RUN mkdir -p /app/uploads

# Пользователь без root-прав
RUN addgroup -g 1001 -S nodejs
RUN adduser -S calapp -u 1001
USER calapp

EXPOSE 3000

# Запускаем миграции и сервер
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
