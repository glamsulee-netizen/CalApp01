// ============================================
// CalApp01 — Calendar Routes
// ============================================
// POST   /api/calendar/activate         — Активация календаря по коду
// GET    /api/calendar/my               — Мои календари (как владелец)
// GET    /api/calendar/subscriptions     — Мои подписки (как участник)
// GET    /api/calendar/:calendarId       — Получить календарь (с слотами)
// PATCH  /api/calendar/:calendarId       — Обновить настройки (специалист)
// POST   /api/calendar/:calendarId/slots — Создать слот
// PATCH  /api/calendar/:calendarId/slots/:slotId — Обновить слот
// DELETE /api/calendar/:calendarId/slots/:slotId — Удалить слот
// GET    /api/calendar/share/:shareLink  — Публичный просмотр по ссылке
// POST   /api/calendar/subscribe/:code   — Подписаться на календарь по коду
// GET    /api/calendar/:calendarId/members — Список участников (специалист)
// PATCH  /api/calendar/:calendarId/members/:memberId — Обновить роль участника
//
// AGENT_INSTRUCTION:
// 1. activate: Принимает одноразовый код от админа. Проверяет PromoCode.
//    Создаёт Calendar с дефолтными настройками из PlatformSettings.
//    Добавляет владельца как CalendarMember(SPECIALIST).
//
// 2. Публичный URL: /api/calendar/share/:shareLink
//    Доступен без авторизации (optionalAuth).
//    Если пользователь авторизован — включает его бронирования.
//    Если нет — только слоты без бронирований.
//
// 3. При создании/обновлении/удалении слотов:
//    Отправлять Socket.IO event в комнату calendar:${calendarId}
//
// 4. subscribe: Пользователь подписывается на календарь по коду.
//    Создаётся CalendarMember(ZOMBIE). Специалист должен повысить до CLIENT.

import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { requireCalendarRole } from '../middleware/roles';
import { validate } from '../middleware/validate';

export const calendarRouter = Router();

// --- Zod-схемы ---

const activateSchema = z.object({
  code: z.string().min(1, 'Введите код активации'),
});

const calendarUpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  startHour: z.number().int().min(0).max(23).optional(),
  endHour: z.number().int().min(1).max(24).optional(),
  slotDuration: z.number().int().min(15).max(240).optional(),
  workDays: z.array(z.number().int().min(1).max(7)).optional(),
  colorScheme: z.record(z.string()).optional(),
  bgImage: z.string().optional(),
  paymentLink: z.string().optional(),
});

const createSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Формат: YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Формат: HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Формат: HH:MM'),
});

const updateSlotSchema = z.object({
  isOpen: z.boolean().optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Формат: HH:MM').optional(),
});

const subscribeSchema = z.object({
  code: z.string().min(1),
});

const updateMemberSchema = z.object({
  role: z.enum(['SPECIALIST', 'CLIENT', 'ZOMBIE']).optional(),
  maxBookings: z.number().int().min(1).max(50).optional(),
});

// --- Маршруты ---

// POST /api/calendar/activate
calendarRouter.post('/activate', requireAuth, validate(activateSchema), async (req, res, next) => {
  // TODO: Реализовать активацию календаря (см. calendar.service.ts)
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// GET /api/calendar/my
calendarRouter.get('/my', requireAuth, async (req, res, next) => {
  // TODO: Вернуть календари где user = owner
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// GET /api/calendar/subscriptions
calendarRouter.get('/subscriptions', requireAuth, async (req, res, next) => {
  // TODO: Вернуть календари где user = member
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// GET /api/calendar/share/:shareLink — публичный доступ
calendarRouter.get('/share/:shareLink', optionalAuth, async (req, res, next) => {
  // TODO: Реализовать публичный просмотр (см. calendar.service.ts)
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// POST /api/calendar/subscribe
calendarRouter.post('/subscribe', requireAuth, validate(subscribeSchema), async (req, res, next) => {
  // TODO: Подписка на календарь по коду
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// GET /api/calendar/:calendarId
calendarRouter.get('/:calendarId', requireAuth, async (req, res, next) => {
  // TODO: Получить календарь с слотами
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/calendar/:calendarId
calendarRouter.patch('/:calendarId', requireAuth, requireCalendarRole('SPECIALIST'), validate(calendarUpdateSchema), async (req, res, next) => {
  // TODO: Обновить настройки календаря
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// POST /api/calendar/:calendarId/slots
calendarRouter.post('/:calendarId/slots', requireAuth, requireCalendarRole('SPECIALIST'), validate(createSlotSchema), async (req, res, next) => {
  // TODO: Создать слот + Socket.IO event
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/calendar/:calendarId/slots/:slotId
calendarRouter.patch('/:calendarId/slots/:slotId', requireAuth, requireCalendarRole('SPECIALIST'), validate(updateSlotSchema), async (req, res, next) => {
  // TODO: Обновить слот + Socket.IO event
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/calendar/:calendarId/slots/:slotId
calendarRouter.delete('/:calendarId/slots/:slotId', requireAuth, requireCalendarRole('SPECIALIST'), async (req, res, next) => {
  // TODO: Удалить слот + Socket.IO event
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// GET /api/calendar/:calendarId/members
calendarRouter.get('/:calendarId/members', requireAuth, requireCalendarRole('SPECIALIST'), async (req, res, next) => {
  // TODO: Список участников с активными бронированиями
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/calendar/:calendarId/members/:memberId
calendarRouter.patch('/:calendarId/members/:memberId', requireAuth, requireCalendarRole('SPECIALIST'), validate(updateMemberSchema), async (req, res, next) => {
  // TODO: Обновить роль/лимит бронирований участника
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});
