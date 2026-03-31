// ============================================
// CalApp01 — Calendar Service
// ============================================
// AGENT_INSTRUCTION:
// Бизнес-логика управления календарями и слотами.
// Методы:
//   activateCalendar()     — Активация нового календаря по промокоду
//   getMyCalendars()       — Календари текущего пользователя (как владельца)
//   getSubscriptions()     — Календари-подписки (как участника)
//   getCalendarByShare()   — Публичный просмотр по shareLink
//   updateCalendar()       — Обновить настройки
//   createSlot()           — Создать слот
//   updateSlot()           — Обновить слот (toggle isOpen, resize)
//   deleteSlot()           — Удалить слот
//   getWeekSlots()         — Слоты за конкретную неделю
//   subscribeToCalendar()  — Подписаться по коду
//   getMembers()           — Участники календаря
//   updateMember()         — Изменить роль/лимит участника

import { prisma, io } from '../index';
import { CalendarUpdateBody, CreateSlotBody, SlotView, CalendarPublicView } from '../types';

/**
 * Активация календаря по промокоду
 * 
 * AGENT_INSTRUCTION:
 * 1. Найти PromoCode по коду, проверить isUsed=false
 * 2. Получить дефолтные настройки из PlatformSettings
 * 3. Создать Calendar с owner=userId
 * 4. Создать CalendarMember(SPECIALIST) для владельца
 * 5. Обновить PromoCode: isUsed=true, usedById, activatedAt=NOW(), expiresAt
 * 6. Всё в транзакции (prisma.$transaction)
 */
export async function activateCalendar(userId: number, code: string) {
  return await prisma.$transaction(async (tx) => {
    const promo = await tx.promoCode.findUnique({ where: { code } });
    if (!promo || promo.isUsed) throw new Error('Недействительный или использованный промокод');
    
    const durationMs = promo.durationDays * 24 * 60 * 60 * 1000;
    
    const calendar = await tx.calendar.create({
      data: {
        ownerId: userId,
        title: 'Мой календарь',
        isActive: true,
        subscriptionEnd: new Date(Date.now() + durationMs)
      }
    });

    await tx.calendarMember.create({
      data: {
        calendarId: calendar.id,
        userId,
        role: 'SPECIALIST',
        maxBookings: 999
      }
    });

    await tx.promoCode.update({
      where: { id: promo.id },
      data: {
        isUsed: true,
        usedById: userId,
        activatedAt: new Date(),
        expiresAt: new Date(Date.now() + durationMs)
      }
    });
    
    return calendar;
  });
}

/**
 * Получить календари пользователя (как владельца)
 */
export async function getMyCalendars(userId: number) {
  return await prisma.calendar.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Получить подписки пользователя
 */
export async function getSubscriptions(userId: number) {
  const members = await prisma.calendarMember.findMany({
    where: { userId },
    include: { calendar: true },
    orderBy: { createdAt: 'desc' }
  });
  return members.map(m => m.calendar);
}

/**
 * Получить слоты календаря за конкретную неделю
 * 
 * AGENT_INSTRUCTION:
 * 1. Рассчитать даты начала/конца недели по переданной дате
 * 2. Вернуть слоты с join на Booking
 * 3. Для специалиста — включить данные бронирований (имя, телефон, оплата)
 * 4. Для обычного пользователя — только isBooked (без данных кто забронировал)
 * 5. Для неавторизованного — слоты без бронирований
 */
export async function getWeekSlots(
  calendarId: number, 
  weekStart: Date, 
  isSpecialist: boolean,
  userId?: number
): Promise<SlotView[]> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const slots = await prisma.slot.findMany({
    where: {
      calendarId,
      date: { gte: weekStart, lt: weekEnd }
    },
    include: {
      booking: isSpecialist ? { include: { user: true } } : true,
    }
  });

  return slots.map(slot => {
    const isBooked = !!slot.booking && slot.booking.status !== 'CANCELLED';
    const isMyBooking = userId ? slot.booking?.userId === userId : false;

    if (isSpecialist) {
      return {
        ...slot,
        isBooked,
        bookingDetails: slot.booking && slot.booking.status !== 'CANCELLED' ? {
          id: slot.booking.id,
          userName: (slot.booking as any).user?.name || '',
          userPhone: (slot.booking as any).user?.phone || '',
          isPaid: slot.booking.isPaid,
          status: slot.booking.status
        } : null
      };
    } else {
      return {
        id: slot.id,
        calendarId: slot.calendarId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isOpen: slot.isOpen,
        isBooked,
        isMyBooking,
      };
    }
  }) as SlotView[];
}

/**
 * Публичный просмотр по shareLink
 * 
 * AGENT_INSTRUCTION:
 * 1. Найти Calendar по shareLink, проверить isActive и subscriptionEnd
 * 2. Вернуть данные календаря + слоты текущей недели
 * 3. Если userId передан — проверить членство, подставить данные о бронированиях пользователя
 */
export async function getCalendarByShare(shareLink: string, userId?: number): Promise<CalendarPublicView | null> {
  const calendar = await prisma.calendar.findUnique({
    where: { shareLink }
  });

  if (!calendar || !calendar.isActive) return null;
  if (calendar.subscriptionEnd && calendar.subscriptionEnd < new Date()) {
    return null; // Подписка истекла
  }

  const now = new Date();
  const day = now.getDay() || 7;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - day + 1);
  weekStart.setHours(0, 0, 0, 0);

  const slots = await getWeekSlots(calendar.id, weekStart, false, userId);

  let role: string | null = null;
  if (userId) {
    const member = await prisma.calendarMember.findUnique({
      where: { calendarId_userId: { calendarId: calendar.id, userId } }
    });
    if (member) role = member.role;
  }

  return {
    calendar,
    role,
    currentWeekSlots: slots
  } as CalendarPublicView;
}

/**
 * Подписка на календарь по коду
 * 
 * AGENT_INSTRUCTION:
 * 1. Найти Calendar по code
 * 2. Проверить isActive и subscriptionEnd
 * 3. Проверить что пользователь ещё не подписан
 * 4. Создать CalendarMember(ZOMBIE)
 * 5. Отправить уведомление специалисту о новом подписчике
 */
export async function subscribeToCalendar(userId: number, calendarCode: string) {
  const calendar = await prisma.calendar.findUnique({ where: { code: calendarCode } });
  if (!calendar || !calendar.isActive) throw new Error('Календарь не найден или неактивен');
  
  if (calendar.subscriptionEnd && calendar.subscriptionEnd < new Date()) {
    throw new Error('Подписка специалиста истекла');
  }

  const existing = await prisma.calendarMember.findUnique({
    where: { calendarId_userId: { calendarId: calendar.id, userId } }
  });

  if (existing) throw new Error('Вы уже подписаны на этот календарь');

  const member = await prisma.calendarMember.create({
    data: { calendarId: calendar.id, userId, role: 'ZOMBIE' }
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  await prisma.notification.create({
    data: {
      userId: calendar.ownerId,
      calendarId: calendar.id,
      type: 'NEW_SUBSCRIBER',
      title: 'Новый подписчик',
      message: `${user?.name || user?.email} подписался на ваш календарь.`
    }
  });

  return member;
}

/**
 * Создание слота
 * 
 * AGENT_INSTRUCTION:
 * 1. Валидировать startTime < endTime
 * 2. Проверить что endTime - startTime кратно 15 минутам
 * 3. Проверить нет пересечений с существующими слотами
 * 4. Создать Slot(isOpen=true)
 * 5. Отправить Socket.IO event: slot:created
 */
export async function createSlot(calendarId: number, data: CreateSlotBody) {
  if (data.startTime >= data.endTime) throw new Error('Время начала должно быть меньше времени окончания');
  
  const dateStr = new Date(data.date).toISOString().split('T')[0];
  const overlaps = await prisma.slot.findMany({
    where: {
      calendarId,
      date: new Date(dateStr),
      OR: [
        { startTime: { lt: data.endTime, gte: data.startTime } },
        { endTime: { gt: data.startTime, lte: data.endTime } },
        { startTime: { lte: data.startTime }, endTime: { gte: data.endTime } }
      ]
    }
  });

  if (overlaps.length > 0) throw new Error('Слот пересекается с существующими');

  const slot = await prisma.slot.create({
    data: {
      calendarId,
      date: new Date(dateStr),
      startTime: data.startTime,
      endTime: data.endTime,
      isOpen: true
    }
  });

  io.to(`calendar:${calendarId}`).emit('slot:created', slot);

  return slot;
}

/**
 * Обновление слота (toggle isOpen / resize)
 * 
 * AGENT_INSTRUCTION:
 * 1. Если isOpen меняется на false и есть бронь — ошибка
 * 2. Если endTime меняется — проверить пересечения
 * 3. Обновить слот
 * 4. Отправить Socket.IO event: slot:updated
 */
export async function updateSlot(calendarId: number, slotId: number, data: { isOpen?: boolean; endTime?: string }) {
  const slot = await prisma.slot.findUnique({ where: { id: slotId }, include: { booking: true } });
  if (!slot || slot.calendarId !== calendarId) throw new Error('Слот не найден');

  if (data.isOpen === false && slot.booking && slot.booking.status === 'ACTIVE') {
    throw new Error('Нельзя закрыть слот с активной бронью');
  }

  if (data.endTime) {
    if (data.endTime <= slot.startTime) throw new Error('endTime должно быть больше startTime');
    
    const overlaps = await prisma.slot.findMany({
      where: {
        calendarId,
        id: { not: slotId },
        date: slot.date,
        OR: [
          { startTime: { lt: data.endTime, gte: slot.startTime } },
          { endTime: { gt: slot.startTime, lte: data.endTime } },
          { startTime: { lte: slot.startTime }, endTime: { gte: data.endTime } }
        ]
      }
    });

    if (overlaps.length > 0) throw new Error('Увеличение слота пересекается с другими');
  }

  const updatedSlot = await prisma.slot.update({
    where: { id: slotId },
    data
  });

  io.to(`calendar:${calendarId}`).emit('slot:updated', updatedSlot);

  return updatedSlot;
}

/**
 * Удаление слота
 * 
 * AGENT_INSTRUCTION:
 * 1. Если есть активная бронь — вернуть ошибку (сначала отмена)
 * 2. Удалить слот
 * 3. Отправить Socket.IO event: slot:deleted
 */
export async function deleteSlot(calendarId: number, slotId: number) {
  const slot = await prisma.slot.findUnique({ where: { id: slotId }, include: { booking: true } });
  if (!slot || slot.calendarId !== calendarId) throw new Error('Слот не найден');

  if (slot.booking && slot.booking.status === 'ACTIVE') {
    throw new Error('Нельзя удалить слот с активной бронью. Сначала отмените бронь.');
  }

  await prisma.slot.delete({ where: { id: slotId } });

  io.to(`calendar:${calendarId}`).emit('slot:deleted', { slotId });
}

// --- Helper: Проверка подписки ---
export async function isSubscriptionActive(calendarId: number): Promise<boolean> {
  const calendar = await prisma.calendar.findUnique({
    where: { id: calendarId },
    select: { isActive: true, subscriptionEnd: true },
  });
  if (!calendar || !calendar.isActive) return false;
  if (!calendar.subscriptionEnd) return true; // null = бессрочно
  return calendar.subscriptionEnd > new Date();
}
