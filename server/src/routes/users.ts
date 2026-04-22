// ============================================
// CalApp01 — Users Routes
// ============================================
// GET    /api/users/me           — Текущий пользователь
// PATCH  /api/users/me           — Обновить профиль
// GET    /api/users/notifications — Уведомления
// PATCH  /api/users/notifications/:id/read — Отметить прочитанным
//
// AGENT_INSTRUCTION:
// - /me: Возвращает полный профиль авторизованного пользователя,
//   включая подписки (CalendarMember[]) и собственные календари
// - PATCH /me: Обновление name, phone, messenger, messengerType
// - notifications: Список in-app уведомлений с пагинацией

import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { prisma } from '../index';

export const usersRouter = Router();

usersRouter.use(requireAuth);

// --- Zod-схемы ---

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  messenger: z.string().max(100).optional(),
  messengerType: z.enum(['telegram', 'whatsapp', 'viber', 'other', '']).optional(),
});

// --- Маршруты ---

// GET /api/users/me
usersRouter.get('/me', async (req, res, next) => {
  try {
    const userId = (req as any).user.id as number;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        messenger: true,
        messengerType: true,
        role: true,
        mustChangePassword: true,
        isActive: true,
        memberships: {
          include: {
            calendar: true,
          },
        },
        ownedCalendars: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/me
usersRouter.patch('/me', validate(updateProfileSchema), async (req, res, next) => {
  try {
    const userId = (req as any).user.id as number;
    const updated = await prisma.user.update({
      where: { id: userId },
      data: req.body,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        messenger: true,
        messengerType: true,
        role: true,
        mustChangePassword: true,
      },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// GET /api/users/notifications
usersRouter.get('/notifications', async (req, res, next) => {
  try {
    const userId = (req as any).user.id as number;
    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    res.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/notifications/:id/read
usersRouter.patch('/notifications/:id/read', async (req, res, next) => {
  try {
    const userId = (req as any).user.id as number;
    const notificationId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(notificationId)) {
      res.status(400).json({ error: 'Некорректный ID уведомления' });
      return;
    }
    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!existing) {
      res.status(404).json({ error: 'Уведомление не найдено' });
      return;
    }
    const updated = existing.isRead
      ? existing
      : await prisma.notification.update({
          where: { id: notificationId },
          data: { isRead: true },
        });
    res.json(updated);
  } catch (error: any) {
    next(error);
  }
});
