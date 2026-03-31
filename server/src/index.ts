// ============================================
// CalApp01 Server — Точка входа
// ============================================
// AGENT_INSTRUCTION:
// Этот файл инициализирует все компоненты сервера:
// 1. Express приложение с middleware
// 2. Socket.IO для real-time обновлений
// 3. Prisma клиент для работы с БД
// 4. Redis клиент для кеширования и pub/sub
// 5. Cron-задачи для напоминаний и очереди email
// 6. Seed начального admin-пользователя при первом запуске

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

import { config } from './config';
import { authRouter } from './routes/auth';
import { adminRouter } from './routes/admin';
import { calendarRouter } from './routes/calendar';
import { bookingRouter } from './routes/booking';
import { usersRouter } from './routes/users';
import { pushRouter } from './routes/push';
import { setupSocketHandlers } from './socket';
import { startCronJobs } from './cron/reminders';
import { seedAdmin } from './services/auth.service';

// --- Инициализация ---
const app = express();
const httpServer = createServer(app);

export const prisma = new PrismaClient();

export const redis = createClient({ url: config.redisUrl });

export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.corsOrigin,
    credentials: true,
  },
  // AGENT_INSTRUCTION: Для масштабирования на несколько инстансов
  // добавить Redis adapter: @socket.io/redis-adapter
});

// --- Middleware ---
app.use(helmet({
  contentSecurityPolicy: false, // PWA требует inline-стили
}));
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// Rate limiting — защита от brute-force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // Максимум запросов с одного IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Более строгий лимит для auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
});
app.use('/api/auth/', authLimiter);

// --- Маршруты API ---
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/booking', bookingRouter);
app.use('/api/users', usersRouter);
app.use('/api/push', pushRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Обработка ошибок ---
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ 
    error: config.nodeEnv === 'production' ? 'Внутренняя ошибка сервера' : err.message 
  });
});

// --- Запуск ---
async function main() {
  try {
    // Подключение к Redis
    await redis.connect();
    console.log('[Redis] Подключено');

    // Подключение к БД
    await prisma.$connect();
    console.log('[Prisma] Подключено к БД');

    // Seed admin при первом запуске
    try {
      await seedAdmin();
    } catch (seedError) {
      console.error('[Seed] Ошибка при создании admin (возможно, миграции не применены):', seedError);
    }

    // WebSocket
    setupSocketHandlers(io);

    // Cron-задачи
    startCronJobs();

    // Запуск HTTP сервера (0.0.0.0 обязательно для Docker)
    httpServer.listen(config.serverPort, '0.0.0.0', () => {
      console.log(`[Server] Запущен на 0.0.0.0:${config.serverPort}`);
      console.log(`[Server] Режим: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('[FATAL] Ошибка запуска:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM получен, завершаем...');
  await prisma.$disconnect();
  await redis.quit();
  httpServer.close();
  process.exit(0);
});

main();
