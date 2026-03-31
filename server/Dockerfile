# ============================================
# CalApp01 Server — Multi-stage Docker Build
# ============================================

# --- Stage 1: Build ---
FROM node:18-alpine AS builder

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

# --- Stage 2: Production ---
FROM node:18-alpine AS production

WORKDIR /app

# Копируем только необходимое
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --omit=dev --legacy-peer-deps
RUN npx prisma@5.10.0 generate

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
