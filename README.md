# CalApp01 — Платформа бронирования записи к специалисту

PWA веб-приложение с календарём для бронирования записи к специалисту.

## Стек технологий

- **Frontend**: React 18 + Vite + TypeScript (PWA)
- **Backend**: Node.js + Express + TypeScript
- **БД**: PostgreSQL 15 + Prisma ORM
- **Кеш**: Redis 7
- **Real-time**: Socket.IO
- **Push**: Web Push API (VAPID)
- **Деплой**: Docker + Nginx + Let's Encrypt

## Быстрый старт (разработка)

```bash
# 1. Установить зависимости
cd server && npm install
cd ../client && npm install

# 2. Скопировать конфиг
cp .env.example .env
# Заполнить .env

# 3. Запустить БД и Redis через Docker
docker-compose up -d postgres redis

# 4. Применить миграции
cd server && npx prisma migrate dev

# 5. Запустить сервер
cd server && npm run dev

# 6. Запустить клиент (в другом терминале)
cd client && npm run dev
```

## Продакшн деплой

См. [docs/DEPLOY.md](docs/DEPLOY.md)

## Структура проекта

```
CalApp01/
├── server/          # Backend API
├── client/          # Frontend PWA
├── nginx/           # Nginx конфигурация
├── docs/            # Документация
└── docker-compose.yml
```
