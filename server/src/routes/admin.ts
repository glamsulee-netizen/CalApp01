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
import crypto from 'crypto';
import { requireAuth } from '../middleware/auth';
import { requirePlatformRole } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { getPlatformStats, generatePromoCodes } from '../services/promo.service';
import { prisma } from '../index';
import { config } from '../config';

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
const smtpUpdateSchema = smtpProviderSchema.partial();

function deriveEncryptionKey(): Buffer {
  return crypto.createHash('sha256').update(config.jwtRefreshSecret).digest();
}

function encryptSecret(value: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', deriveEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

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
  try {
    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/users/:userId
adminRouter.patch('/users/:userId', validate(updateUserSchema), async (req, res, next) => {
  try {
    const userId = Number.parseInt(req.params.userId, 10);
    if (Number.isNaN(userId)) {
      res.status(400).json({ error: 'Некорректный ID пользователя' });
      return;
    }
    const user = await prisma.user.update({
      where: { id: userId },
      data: req.body,
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
    res.json(user);
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }
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
  try {
    const settings = await prisma.platformSettings.findMany({
      orderBy: { key: 'asc' },
    });
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/settings
adminRouter.patch('/settings', async (req, res, next) => {
  try {
    const payload = req.body as Record<string, string | number | boolean | null | undefined>;
    const entries = Object.entries(payload).filter(([, value]) => value !== undefined && value !== null);
    const settings = await Promise.all(
      entries.map(([key, value]) =>
        prisma.platformSettings.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        }),
      ),
    );
    res.json({ updated: settings.length, settings });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/smtp
adminRouter.get('/smtp', async (req, res, next) => {
  try {
    const providers = await prisma.smtpProvider.findMany({
      orderBy: [{ priority: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        user: true,
        fromEmail: true,
        dailyLimit: true,
        sentToday: true,
        lastResetAt: true,
        isActive: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json(providers);
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/smtp
adminRouter.post('/smtp', validate(smtpProviderSchema), async (req, res, next) => {
  try {
    const created = await prisma.smtpProvider.create({
      data: {
        ...req.body,
        password: encryptSecret(req.body.password),
      },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        user: true,
        fromEmail: true,
        dailyLimit: true,
        sentToday: true,
        isActive: true,
        priority: true,
      },
    });
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/smtp/:id
adminRouter.patch('/smtp/:id', validate(smtpUpdateSchema), async (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Некорректный ID SMTP-провайдера' });
      return;
    }
    const data = { ...req.body } as Record<string, unknown>;
    if (typeof data.password === 'string' && data.password.length > 0) {
      data.password = encryptSecret(data.password);
    } else {
      delete data.password;
    }
    const updated = await prisma.smtpProvider.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        user: true,
        fromEmail: true,
        dailyLimit: true,
        sentToday: true,
        isActive: true,
        priority: true,
      },
    });
    res.json(updated);
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'SMTP-провайдер не найден' });
      return;
    }
    next(error);
  }
});

// DELETE /api/admin/smtp/:id
adminRouter.delete('/smtp/:id', async (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Некорректный ID SMTP-провайдера' });
      return;
    }
    await prisma.smtpProvider.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'SMTP-провайдер не найден' });
      return;
    }
    next(error);
  }
});
