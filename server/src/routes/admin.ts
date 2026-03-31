// ============================================
// CalApp01 — Admin Routes
// ============================================
// Все маршруты требуют PlatformRole.ADMIN
//
// GET    /api/admin/stats              — Статистика платформы
// GET    /api/admin/users              — Список пользователей
// PATCH  /api/admin/users/:userId      — Обновить роль/статус пользователя
// POST   /api/admin/promo/generate     — Генерация промокодов
// GET    /api/admin/promo              — Список промокодов
// GET    /api/admin/settings           — Настройки платформы
// PATCH  /api/admin/settings           — Обновить настройки
// GET    /api/admin/smtp               — Список SMTP-провайдеров
// POST   /api/admin/smtp               — Добавить SMTP-провайдер
// PATCH  /api/admin/smtp/:id           — Обновить SMTP-провайдер
// DELETE /api/admin/smtp/:id           — Удалить SMTP-провайдер
//
// AGENT_INSTRUCTION:
// 1. stats: Считать кол-во users, calendars, active bookings через Prisma.count
// 2. users: Поддержать пагинацию (?page=1&limit=20), поиск (?search=email/name)
// 3. promo/generate: Генерировать count штук уникальных 8-символьных кодов (A-Z0-9)
//    Вставка пакетом через prisma.promoCode.createMany
// 4. settings: Ключ-значение в таблице PlatformSettings
// 5. smtp: CRUD для SmtpProvider. Пароль шифровать перед сохранением (AES-256)

import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { requirePlatformRole } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { getPlatformStats, generatePromoCodes } from '../services/promo.service';
import { prisma } from '../index';

export const adminRouter = Router();

// Все маршруты требуют admin-роль
adminRouter.use(requireAuth, requirePlatformRole('ADMIN'));

// --- Zod-схемы ---

const generatePromoSchema = z.object({
  type: z.enum(['SUBSCRIPTION_MONTH', 'SUBSCRIPTION_YEAR']),
  count: z.number().int().min(1).max(100),
});

const updateUserSchema = z.object({
  role: z.enum(['ADMIN', 'USER']).optional(),
  isActive: z.boolean().optional(),
});

const smtpProviderSchema = z.object({
  name: z.string().min(1),
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  user: z.string().min(1),
  password: z.string().min(1),
  fromEmail: z.string().email(),
  dailyLimit: z.number().int().min(1),
  priority: z.number().int().min(0),
  isActive: z.boolean().optional(),
});

// --- Маршруты ---

// GET /api/admin/stats
adminRouter.get('/stats', async (req, res, next) => {
  try {
    const stats = await getPlatformStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/users
adminRouter.get('/users', async (req, res, next) => {
  // TODO: Реализовать с пагинацией и поиском
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/users/:userId
adminRouter.patch('/users/:userId', validate(updateUserSchema), async (req, res, next) => {
  // TODO: Реализовать обновление пользователя
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/promo/generate
adminRouter.post('/promo/generate', validate(generatePromoSchema), async (req, res, next) => {
  try {
    const { type, count } = req.body;
    const codes = await generatePromoCodes(type, count);
    res.status(201).json({ codes });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/promo
adminRouter.get('/promo', async (req, res, next) => {
  try {
    const promos = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200, // Limit to recent 200 to prevent huge payloads
    });
    res.json(promos);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/settings
adminRouter.get('/settings', async (req, res, next) => {
  // TODO: Реализовать получение настроек
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/settings
adminRouter.patch('/settings', async (req, res, next) => {
  // TODO: Реализовать обновление настроек
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/smtp
adminRouter.get('/smtp', async (req, res, next) => {
  // TODO: Реализовать список SMTP-провайдеров (без паролей!)
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/smtp
adminRouter.post('/smtp', validate(smtpProviderSchema), async (req, res, next) => {
  // TODO: Реализовать добавление SMTP-провайдера
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/smtp/:id
adminRouter.patch('/smtp/:id', async (req, res, next) => {
  // TODO: Реализовать обновление SMTP-провайдера
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/smtp/:id
adminRouter.delete('/smtp/:id', async (req, res, next) => {
  // TODO: Реализовать удаление SMTP-провайдера
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});
