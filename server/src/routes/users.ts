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
  // TODO: Реализовать получение профиля с подписками и календарями
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/me
usersRouter.patch('/me', validate(updateProfileSchema), async (req, res, next) => {
  // TODO: Реализовать обновление профиля
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/notifications
usersRouter.get('/notifications', async (req, res, next) => {
  // TODO: Реализовать пагинированный список уведомлений
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/notifications/:id/read
usersRouter.patch('/notifications/:id/read', async (req, res, next) => {
  // TODO: Отметить уведомление как прочитанное
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});
