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

// --- Маршруты ---

// POST /api/booking
bookingRouter.post('/', validate(createBookingSchema), async (req, res, next) => {
  // TODO: Реализовать создание бронирования (см. booking.service.ts → createBooking)
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/booking/:bookingId
bookingRouter.delete('/:bookingId', async (req, res, next) => {
  // TODO: Реализовать отмену (см. booking.service.ts → cancelBooking)
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// POST /api/booking/:bookingId/move
bookingRouter.post('/:bookingId/move', validate(moveBookingSchema), async (req, res, next) => {
  // TODO: Реализовать перенос (см. booking.service.ts → moveBooking)
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/booking/:bookingId/paid
bookingRouter.patch('/:bookingId/paid', async (req, res, next) => {
  // TODO: Реализовать toggle оплаты (только специалист)
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// GET /api/booking/my
bookingRouter.get('/my', async (req, res, next) => {
  // TODO: Вернуть бронирования текущего пользователя (статус ACTIVE)
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// GET /api/booking/upcoming
bookingRouter.get('/upcoming', async (req, res, next) => {
  // TODO: Вернуть ближайшее бронирование (для плашки в UI)
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// GET /api/booking/calendar/:calendarId
bookingRouter.get('/calendar/:calendarId', async (req, res, next) => {
  // TODO: Вернуть все бронирования календаря (для специалиста)
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});
