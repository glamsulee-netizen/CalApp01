// ============================================
// CalApp01 — Booking Service
// ============================================
// AGENT_INSTRUCTION:
// Бизнес-логика бронирования. Race condition предотвращается через Redis lock.

import { prisma, redis, io } from '../index';
import { BookingView } from '../types';
import { sendPushToUser } from './push.service';

const LOCK_PREFIX = 'slot:lock:';
const LOCK_TTL = 10; // секунд

/**
 * Создание бронирования
 * 
 * AGENT_INSTRUCTION:
 * 1. Проверить что CalendarMember существует и role=CLIENT
 * 2. Подсчитать активные бронирования пользователя в этом календаре
 *    Если count >= member.maxBookings → ошибка
 * 3. Redis lock: SET slot:lock:{slotId} {userId} NX EX 10
 *    Если lock не получен → ошибка "Слот занимается другим пользователем"
 * 4. Проверить slot.isOpen === true
 * 5. Проверить нет активного бронирования на этот слот
 * 6. В транзакции Prisma:
 *    - Создать Booking(status=ACTIVE)
 *    - Создать Notification для специалиста
 * 7. Socket.IO: io.to(`calendar:${calendarId}`).emit('booking:created', ...)
 * 8. Push специалисту (всем с ролью SPECIALIST в этом календаре)
 * 9. В finally: освободить Redis lock (DEL)
 */
export async function createBooking(userId: number, slotId: number, calendarId: number) {
  const lockKey = `${LOCK_PREFIX}${slotId}`;
  
  try {
    // Получение Redis lock
    const lockAcquired = await redis.set(lockKey, userId.toString(), {
      NX: true,
      EX: LOCK_TTL,
    });

    if (!lockAcquired) {
      throw new Error('Слот занимается другим пользователем, попробуйте позже');
    }

    const member = await prisma.calendarMember.findUnique({
      where: { calendarId_userId: { calendarId, userId } }
    });
    if (!member || member.role === 'ZOMBIE') throw new Error('Нет прав для бронирования в этом календаре');

    const activeBookings = await prisma.booking.count({
      where: { userId, calendarId, status: 'ACTIVE' }
    });
    if (activeBookings >= member.maxBookings) throw new Error(`Превышен лимит активных бронирований (${member.maxBookings})`);

    const slot = await prisma.slot.findUnique({ where: { id: slotId }, include: { booking: true } });
    if (!slot || !slot.isOpen) throw new Error('Слот недоступен');
    if (slot.booking && slot.booking.status !== 'CANCELLED') throw new Error('Слот уже занят');

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: { slotId, userId, calendarId, status: 'ACTIVE' },
        include: { slot: true, user: true }
      });

      const calendar = await tx.calendar.findUnique({ where: { id: calendarId } });
      const slotDate = new Date(booking.slot.date).toISOString().split('T')[0];
      await tx.notification.create({
        data: {
          userId: calendar!.ownerId,
          calendarId,
          type: 'BOOKING_CREATED',
          title: 'Новая запись',
          message: `${booking.user.name || booking.user.email} записался на ${slotDate} в ${booking.slot.startTime}`
        }
      });

      return { booking, ownerId: calendar!.ownerId };
    });

    io.to(`calendar:${calendarId}`).emit('booking:created', { slotId, bookingId: result.booking.id });
    await sendPushToUser(result.ownerId, 'Новая запись', result.booking.user.name || result.booking.user.email);
    
    return result.booking;
  } finally {
    await redis.del(lockKey);
  }
}

/**
 * Отмена бронирования
 * 
 * AGENT_INSTRUCTION:
 * 1. Найти бронирование, проверить что оно ACTIVE
 * 2. Проверить права: userId === booking.userId ИЛИ role === SPECIALIST
 * 3. Обновить status=CANCELLED
 * 4. Создать Notification:
 *    - Если отменяет пользователь → уведомить специалиста
 *    - Если отменяет специалист → уведомить пользователя
 * 5. Socket.IO: emit('booking:cancelled')
 * 6. Push
 */
export async function cancelBooking(bookingId: number, cancelledByUserId: number) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { slot: true, user: true, calendar: true }
  });
  if (!booking || booking.status !== 'ACTIVE') throw new Error('Бронирование не найдено или не активно');

  let isSpecialist = false;
  if (booking.userId !== cancelledByUserId) {
    const member = await prisma.calendarMember.findUnique({
      where: { calendarId_userId: { calendarId: booking.calendarId, userId: cancelledByUserId } }
    });
    if (!member || member.role !== 'SPECIALIST') throw new Error('Нет прав для отмены');
    isSpecialist = true;
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } });

    const notifyUserId = isSpecialist ? booking.userId : booking.calendar.ownerId;
    const msg = isSpecialist ? 'Специалист отменил вашу запись' : `${booking.user.name || booking.user.email} отменил запись`;
    const slotDate = new Date(booking.slot.date).toISOString().split('T')[0];

    await tx.notification.create({
      data: {
        userId: notifyUserId,
        calendarId: booking.calendarId,
        type: 'BOOKING_CANCELLED',
        title: 'Отмена записи',
        message: `${msg} на ${slotDate} в ${booking.slot.startTime}`
      }
    });

    io.to(`calendar:${booking.calendarId}`).emit('booking:cancelled', { slotId: booking.slotId, bookingId });
    sendPushToUser(notifyUserId, 'Отмена записи', msg).catch(() => {});
  });
}

/**
 * Перенос бронирования на другой слот
 * 
 * AGENT_INSTRUCTION:
 * 1. Найти текущее бронирование
 * 2. Проверить права (только booking.userId)
 * 3. Проверить новый слот (isOpen, нет бронирований)
 * 4. В транзакции:
 *    - Обновить старое бронирование status=CANCELLED
 *    - Создать новое бронирование
 * 5. Socket.IO: emit('booking:moved')
 * 6. Push + Notification специалисту о переносе
 */
export async function moveBooking(bookingId: number, userId: number, newSlotId: number) {
  const lockKey = `${LOCK_PREFIX}${newSlotId}`;
  try {
    const lockAcquired = await redis.set(lockKey, userId.toString(), { NX: true, EX: LOCK_TTL });
    if (!lockAcquired) throw new Error('Слот занимается другим пользователем');

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId, userId },
      include: { slot: true, user: true, calendar: true }
    });
    if (!booking || booking.status !== 'ACTIVE') throw new Error('Бронирование не найдено');

    const newSlot = await prisma.slot.findUnique({ where: { id: newSlotId }, include: { booking: true } });
    if (!newSlot || !newSlot.isOpen || newSlot.calendarId !== booking.calendarId) throw new Error('Недопустимый слот');
    if (newSlot.booking && newSlot.booking.status !== 'CANCELLED') throw new Error('Слот уже занят');

    const result = await prisma.$transaction(async (tx) => {
      await tx.booking.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } });
      const newBooking = await tx.booking.create({
        data: { slotId: newSlotId, userId, calendarId: booking.calendarId, status: 'ACTIVE' },
        include: { slot: true }
      });

      const oldDate = new Date(booking.slot.date).toISOString().split('T')[0];
      const newDate = new Date(newSlot.date).toISOString().split('T')[0];

      await tx.notification.create({
        data: {
          userId: booking.calendar.ownerId,
          calendarId: booking.calendarId,
          type: 'BOOKING_MOVED',
          title: 'Перенос записи',
          message: `${booking.user.name || booking.user.email} перенес запись с ${oldDate} на ${newDate} в ${newSlot.startTime}`
        }
      });
      return newBooking;
    });

    io.to(`calendar:${booking.calendarId}`).emit('booking:moved', { oldSlotId: booking.slotId, newSlotId, bookingId: result.id });
    sendPushToUser(booking.calendar.ownerId, 'Перенос записи', 'Проверьте уведомления').catch(() => {});
    return result;
  } finally {
    await redis.del(lockKey);
  }
}

/**
 * Toggle оплаты (только для специалиста)
 */
export async function togglePayment(bookingId: number, specialistUserId: number) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { calendar: true }
  });
  if (!booking) throw new Error('Бронирование не найдено');

  const member = await prisma.calendarMember.findUnique({
    where: { calendarId_userId: { calendarId: booking.calendarId, userId: specialistUserId } }
  });
  if (!member || member.role !== 'SPECIALIST') throw new Error('Нет прав');

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { isPaid: !booking.isPaid }
  });
  
  io.to(`calendar:${booking.calendarId}`).emit('booking:payment_toggled', { bookingId, isPaid: updated.isPaid });
  return updated;
}

/**
 * Ближайшее активное бронирование пользователя
 * 
 * AGENT_INSTRUCTION:
 * Найти Booking(status=ACTIVE) с Slot.date >= сегодня, ORDER BY date ASC, startTime ASC, LIMIT 1
 */
export async function getUpcomingBooking(userId: number): Promise<BookingView | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bookings = await prisma.booking.findMany({
    where: {
      userId,
      status: 'ACTIVE',
      slot: { date: { gte: today } }
    },
    include: { slot: { include: { calendar: true } } },
    orderBy: [
      { slot: { date: 'asc' } },
      { slot: { startTime: 'asc' } }
    ],
    take: 1
  });

  if (bookings.length === 0) return null;
  const b = bookings[0];

  return {
    id: b.id,
    slotId: b.slotId,
    calendarId: b.calendarId,
    isPaid: b.isPaid,
    status: b.status,
    slot: {
      date: b.slot.date,
      startTime: b.slot.startTime,
      endTime: b.slot.endTime,
      calendar: { title: b.slot.calendar.title }
    }
  } as BookingView;
}

/**
 * Все активные бронирования пользователя
 */
export async function getUserBookings(userId: number): Promise<BookingView[]> {
  const bookings = await prisma.booking.findMany({
    where: { userId },
    include: { slot: { include: { calendar: true } } },
    orderBy: [{ slot: { date: 'desc' } }, { slot: { startTime: 'desc' } }]
  });

  return bookings.map(b => ({
    id: b.id,
    slotId: b.slotId,
    calendarId: b.calendarId,
    isPaid: b.isPaid,
    status: b.status,
    slot: {
      date: b.slot.date,
      startTime: b.slot.startTime,
      endTime: b.slot.endTime,
      calendar: { title: b.slot.calendar.title }
    }
  })) as BookingView[];
}
