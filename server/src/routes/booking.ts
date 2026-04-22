// ============================================
// CalApp01 — Booking Routes
// ============================================
// POST   /api/booking                — Создать бронирование
// DELETE /api/booking/:bookingId     — Отменить бронирование
// POST   /api/booking/:bookingId/move — Перенести бронирование
// PATCH  /api/booking/:bookingId/paid — Отметить оплату (специалист)
// GET    /api/booking/my              — Мои бронирования
// GET    /api/booking/calendar/:calendarId — Бронирования календаря (специалист)
// GET    /api/booking/upcoming        — Ближайшая запись
//
// AGENT_INSTRUCTION:
// 1. Создание бронирования:
//    a. Проверить CalendarMember.role === CLIENT
//    b. Проверить активные брони пользователя < CalendarMember.maxBookings
//    c. Заблокировать слот в Redis (SET slot:lock:{slotId} userId NX EX 10)
//    d. Проверить slot.isOpen === true и нет активных бронирований
//    e. Создать Booking(ACTIVE)
//    f. Отправить Socket.IO: booking:created → calendar:{calendarId}
//    g. Отправить Push специалисту
//    h. Создать Notification для специалиста
//    i. Снять Redis lock
//
// 2. Отмена бронирования:
//    - Пользователь может отменить свою бронь
//    - Специалист может отменить бронь любого пользователя
//    - При отмене: Socket.IO + Push + Notification
//
// 3. Перенос бронирования:
//    - Отменяет старый слот и бронирует новый (атомарно в транзакции)
//    - Push + Notification специалисту о переносе
//
// 4. Отметка оплаты:
//    - Только специалист (requireCalendarRole SPECIALIST)
//    - Toggle: isPaid = true/false

import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  cancelBooking,
  createBooking,
  getCalendarBookings,
  getUpcomingBooking,
  getUserBookings,
  moveBooking,
  togglePayment,
} from '../services/booking.service';
import { prisma } from '../index';

export const bookingRouter = Router();

// Все маршруты требуют авторизации
bookingRouter.use(requireAuth);

// --- Zod-схемы ---

const createBookingSchema = z.object({
  slotId: z.number().int().positive(),
  calendarId: z.number().int().positive(),
});

const moveBookingSchema = z.object({
  newSlotId: z.number().int().positive(),
});

function parseId(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

// --- Маршруты ---

// POST /api/booking
bookingRouter.post('/', validate(createBookingSchema), async (req, res, next) => {
  try {
    const booking = await createBooking(req.user!.id, req.body.slotId, req.body.calendarId);
    res.status(201).json(booking);
  } catch (error: any) {
    if (error.message?.includes('Нет прав') || error.message?.includes('лимит')) {
      res.status(403).json({ error: error.message });
      return;
    }
    if (
      error.message?.includes('недоступен') ||
      error.message?.includes('занят') ||
      error.message?.includes('Превышен')
    ) {
      res.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// DELETE /api/booking/:bookingId
bookingRouter.delete('/:bookingId', async (req, res, next) => {
  try {
    const bookingId = parseId(req.params.bookingId);
    if (!bookingId) {
      res.status(400).json({ error: 'Некорректный ID бронирования' });
      return;
    }
    await cancelBooking(bookingId, req.user!.id);
    res.status(204).send();
  } catch (error: any) {
    if (error.message?.includes('не найдено')) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error.message?.includes('Нет прав')) {
      res.status(403).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// POST /api/booking/:bookingId/move
bookingRouter.post('/:bookingId/move', validate(moveBookingSchema), async (req, res, next) => {
  try {
    const bookingId = parseId(req.params.bookingId);
    if (!bookingId) {
      res.status(400).json({ error: 'Некорректный ID бронирования' });
      return;
    }
    const booking = await moveBooking(bookingId, req.user!.id, req.body.newSlotId);
    res.json(booking);
  } catch (error: any) {
    if (error.message?.includes('не найдено')) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error.message?.includes('занимается') || error.message?.includes('Недопустимый слот')) {
      res.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// PATCH /api/booking/:bookingId/paid
bookingRouter.patch('/:bookingId/paid', async (req, res, next) => {
  try {
    const bookingId = parseId(req.params.bookingId);
    if (!bookingId) {
      res.status(400).json({ error: 'Некорректный ID бронирования' });
      return;
    }
    const booking = await togglePayment(bookingId, req.user!.id);
    res.json(booking);
  } catch (error: any) {
    if (error.message?.includes('Нет прав')) {
      res.status(403).json({ error: error.message });
      return;
    }
    if (error.message?.includes('не найдено')) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// GET /api/booking/my
bookingRouter.get('/my', async (req, res, next) => {
  try {
    const bookings = await getUserBookings(req.user!.id);
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

// GET /api/booking/upcoming
bookingRouter.get('/upcoming', async (req, res, next) => {
  try {
    const booking = await getUpcomingBooking(req.user!.id);
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

// GET /api/booking/calendar/:calendarId
bookingRouter.get('/calendar/:calendarId', async (req, res, next) => {
  try {
    const calendarId = parseId(req.params.calendarId);
    if (!calendarId) {
      res.status(400).json({ error: 'Некорректный ID календаря' });
      return;
    }
    if (req.user!.role !== 'ADMIN') {
      const calendar = await prisma.calendar.findUnique({
        where: { id: calendarId },
        select: { ownerId: true },
      });
      if (!calendar) {
        res.status(404).json({ error: 'Календарь не найден' });
        return;
      }
      if (calendar.ownerId !== req.user!.id) {
        const member = await prisma.calendarMember.findUnique({
          where: { calendarId_userId: { calendarId, userId: req.user!.id } },
        });
        if (!member || member.role !== 'SPECIALIST') {
          res.status(403).json({ error: 'Недостаточно прав' });
          return;
        }
      }
    }
    const bookings = await getCalendarBookings(calendarId);
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});
