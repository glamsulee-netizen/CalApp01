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

import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { requireCalendarRole } from '../middleware/roles';
import { validate } from '../middleware/validate';
import {
  activateCalendar,
  createSlot,
  deleteSlot,
  getCalendarById,
  getCalendarByShare,
  getMembers,
  getMyCalendars,
  getSubscriptions,
  getWeekSlots,
  subscribeToCalendar,
  updateCalendar,
  updateMember,
  updateSlot,
} from '../services/calendar.service';

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
calendarRouter.post('/activate', requireAuth, validate(activateSchema), async (req: any, res: Response, next: NextFunction) => {
  try {
    const calendar = await activateCalendar(req.user.id, req.body.code);
    res.json({ message: 'Календарь успешно активирован', calendar });
  } catch (error: any) {
    if (error.message.includes('Недействительный')) {
      res.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// GET /api/calendar/my
calendarRouter.get('/my', requireAuth, async (req: any, res: Response, next: NextFunction) => {
  try {
    const calendars = await getMyCalendars(req.user.id);
    res.json(calendars);
  } catch (error) {
    next(error);
  }
});

// GET /api/calendar/subscriptions
calendarRouter.get('/subscriptions', requireAuth, async (req: any, res: Response, next: NextFunction) => {
  try {
    const calendars = await getSubscriptions(req.user.id);
    res.json(calendars);
  } catch (error) {
    next(error);
  }
});

// GET /api/calendar/share/:shareLink — публичный доступ
calendarRouter.get('/share/:shareLink', optionalAuth, async (req, res, next) => {
  try {
    const data = await getCalendarByShare(req.params.shareLink, (req as any).user?.id);
    if (!data) {
      res.status(404).json({ error: 'Календарь не найден' });
      return;
    }
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// POST /api/calendar/subscribe
calendarRouter.post('/subscribe', requireAuth, validate(subscribeSchema), async (req: any, res: Response, next: NextFunction) => {
  try {
    const member = await subscribeToCalendar(req.user.id, req.body.code);
    res.json({ message: 'Успешная подписка на календарь', member });
  } catch (error: any) {
    if (error.message.includes('не найден') || error.message.includes('уже подписаны')) {
      res.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// GET /api/calendar/:calendarId
calendarRouter.get('/:calendarId', requireAuth, async (req, res, next) => {
  try {
    const calendarId = Number.parseInt(req.params.calendarId, 10);
    if (Number.isNaN(calendarId)) {
      res.status(400).json({ error: 'Некорректный ID календаря' });
      return;
    }
    const week = typeof req.query.week === 'string' ? new Date(req.query.week) : undefined;
    const data = await getCalendarById(calendarId, (req as any).user.id, week);
    res.json(data);
  } catch (error: any) {
    if (error.message?.includes('не найден')) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error.message?.includes('Нет доступа')) {
      res.status(403).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// PATCH /api/calendar/:calendarId
calendarRouter.patch('/:calendarId', requireAuth, requireCalendarRole('SPECIALIST'), validate(calendarUpdateSchema), async (req, res, next) => {
  try {
    const calendarId = Number.parseInt(req.params.calendarId, 10);
    const calendar = await updateCalendar(calendarId, req.body);
    res.json(calendar);
  } catch (error) {
    next(error);
  }
});

// POST /api/calendar/:calendarId/slots
calendarRouter.post('/:calendarId/slots', requireAuth, requireCalendarRole('SPECIALIST'), validate(createSlotSchema), async (req, res, next) => {
  try {
    const calendarId = Number.parseInt(req.params.calendarId, 10);
    const slot = await createSlot(calendarId, req.body);
    res.status(201).json(slot);
  } catch (error: any) {
    if (error.message?.includes('пересекается') || error.message?.includes('Время начала')) {
      res.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// PATCH /api/calendar/:calendarId/slots/:slotId
calendarRouter.patch('/:calendarId/slots/:slotId', requireAuth, requireCalendarRole('SPECIALIST'), validate(updateSlotSchema), async (req, res, next) => {
  try {
    const calendarId = Number.parseInt(req.params.calendarId, 10);
    const slotId = Number.parseInt(req.params.slotId, 10);
    const slot = await updateSlot(calendarId, slotId, req.body);
    res.json(slot);
  } catch (error: any) {
    if (error.message?.includes('не найден')) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error.message?.includes('Нельзя') || error.message?.includes('пересекается') || error.message?.includes('endTime')) {
      res.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// DELETE /api/calendar/:calendarId/slots/:slotId
calendarRouter.delete('/:calendarId/slots/:slotId', requireAuth, requireCalendarRole('SPECIALIST'), async (req, res, next) => {
  try {
    const calendarId = Number.parseInt(req.params.calendarId, 10);
    const slotId = Number.parseInt(req.params.slotId, 10);
    await deleteSlot(calendarId, slotId);
    res.status(204).send();
  } catch (error: any) {
    if (error.message?.includes('не найден')) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error.message?.includes('Нельзя удалить')) {
      res.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// GET /api/calendar/:calendarId/members
calendarRouter.get('/:calendarId/members', requireAuth, requireCalendarRole('SPECIALIST'), async (req, res, next) => {
  try {
    const calendarId = Number.parseInt(req.params.calendarId, 10);
    const members = await getMembers(calendarId);
    res.json(members);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/calendar/:calendarId/members/:memberId
calendarRouter.patch('/:calendarId/members/:memberId', requireAuth, requireCalendarRole('SPECIALIST'), validate(updateMemberSchema), async (req, res, next) => {
  try {
    const calendarId = Number.parseInt(req.params.calendarId, 10);
    const memberId = Number.parseInt(req.params.memberId, 10);
    const member = await updateMember(calendarId, memberId, req.body);
    res.json(member);
  } catch (error: any) {
    if (error.message?.includes('не найден')) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});

calendarRouter.get('/:calendarId/slots', requireAuth, async (req: any, res: Response, next: NextFunction) => {
  try {
    const calendarId = Number.parseInt(req.params.calendarId, 10);
    const week = typeof req.query.week === 'string' ? new Date(req.query.week) : new Date();
    const calendar = await getCalendarById(calendarId, req.user.id, week);
    const isSpecialist = calendar.role === 'SPECIALIST';
    const slots = await getWeekSlots(calendarId, week, isSpecialist, req.user.id);
    res.json(slots);
  } catch (error: any) {
    if (error.message?.includes('не найден')) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error.message?.includes('Нет доступа')) {
      res.status(403).json({ error: error.message });
      return;
    }
    next(error);
  }
});
