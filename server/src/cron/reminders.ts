// ============================================
// CalApp01 — Cron Jobs (Напоминания + SMTP)
// ============================================
// AGENT_INSTRUCTION:
// Cron-задачи:
// 1. Каждые 5 минут: обработка EmailQueue
// 2. Каждые 10 минут: напоминания за 1 час до события
// 3. Ежедневно в 00:00: сброс SMTP-счётчиков
// 4. Ежедневно в 03:00: проверка истекших подписок

import cron from 'node-cron';
import { prisma, redis } from '../index';
import { sendPushToUser, sendPushToCalendarSpecialists } from '../services/push.service';
import { processEmailQueue, resetDailyCounters } from '../services/email.service';

export function startCronJobs(): void {
  
  // --- Каждые 5 минут: обработка очереди email ---
  cron.schedule('*/5 * * * *', async () => {
    try {
      await processEmailQueue();
    } catch (error) {
      console.error('[Cron] Ошибка обработки email-очереди:', error);
    }
  });

  // --- Каждые 10 минут: напоминания за 1 час ---
  cron.schedule('*/10 * * * *', async () => {
    try {
      await sendUpcomingReminders();
    } catch (error) {
      console.error('[Cron] Ошибка отправки напоминаний:', error);
    }
  });

  // --- Ежедневно в 00:00: сброс SMTP-счётчиков ---
  cron.schedule('0 0 * * *', async () => {
    try {
      await resetDailyCounters();
    } catch (error) {
      console.error('[Cron] Ошибка сброса SMTP-счётчиков:', error);
    }
  });

  // --- Ежедневно в 03:00: проверка подписок ---
  cron.schedule('0 3 * * *', async () => {
    try {
      await deactivateExpiredSubscriptions();
    } catch (error) {
      console.error('[Cron] Ошибка проверки подписок:', error);
    }
  });

  console.log('[Cron] Задачи запланированы');
}

/**
 * Напоминание за 1 час до события
 */
async function sendUpcomingReminders(): Promise<void> {
  console.log('[Cron] Проверка напоминаний...');
  const now = new Date();
  
  // Ищем слоты за сегодня и завтра (для стыков суток)
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  
  const targetEnd = new Date(now);
  targetEnd.setDate(targetEnd.getDate() + 2);

  const bookings = await prisma.booking.findMany({
    where: {
      status: 'ACTIVE',
      slot: {
        date: { gte: startOfToday, lt: targetEnd }
      }
    },
    include: {
      slot: { include: { calendar: true } },
      user: true
    }
  });

  const MIN_MS = 50 * 60 * 1000;
  const MAX_MS = 70 * 60 * 1000;

  for (const b of bookings) {
    const slotD = new Date(b.slot.date);
    const [hours, mins] = b.slot.startTime.split(':').map(Number);
    slotD.setHours(hours, mins, 0, 0);

    const diff = slotD.getTime() - now.getTime();

    if (diff > MIN_MS && diff <= MAX_MS) {
      const lockKey = `reminder:${b.id}`;
      const isSet = await redis.set(lockKey, '1', { NX: true, EX: 7200 }); // Блокировка на 2 часа

      if (isSet) {
        // Push пользователю
        const msgClient = `Ждем вас сегодня в ${b.slot.startTime}`;
        await sendPushToUser(b.userId, 'Напоминание о записи', msgClient);
        await prisma.notification.create({
           data: { userId: b.userId, calendarId: b.calendarId, type: 'REMINDER', title: 'Напоминание', message: msgClient }
        });

        // Push специалисту
        const msgSpec = `У вас запись: ${b.user.name || b.user.email} в ${b.slot.startTime}`;
        await sendPushToCalendarSpecialists(b.calendarId, 'Напоминание о клиенте', msgSpec);
        await prisma.notification.create({
           data: { userId: b.slot.calendar.ownerId, calendarId: b.calendarId, type: 'REMINDER', title: 'Скоро клиент', message: msgSpec }
        });
      }
    }
  }
}

/**
 * Деактивация истёкших подписок
 */
async function deactivateExpiredSubscriptions(): Promise<void> {
  const expired = await prisma.calendar.updateMany({
    where: {
      isActive: true,
      subscriptionEnd: {
        lt: new Date(),
        not: null,
      },
    },
    data: {
      isActive: false,
    },
  });

  if (expired.count > 0) {
    console.log(`[Cron] Деактивировано ${expired.count} подписок`);
  }

  // Предупреждение за 7 дней
  const now = new Date();
  const warningDate = new Date(now);
  warningDate.setDate(now.getDate() + 7);
  
  const expiringSoon = await prisma.calendar.findMany({
    where: {
      isActive: true,
      subscriptionEnd: {
        gte: now,
        lt: warningDate,
      }
    }
  });

  for (const cal of expiringSoon) {
    const lockKey = `warn_sub:${cal.id}`;
    const isSet = await redis.set(lockKey, '1', { NX: true, EX: 24 * 3600 }); // Уведомлять раз в сутки
    if (isSet) {
      await sendPushToUser(cal.ownerId, 'Подписка истекает', 'Подписка на ваш календарь истекает менее чем через 7 дней.');
      await prisma.notification.create({
        data: { userId: cal.ownerId, calendarId: cal.id, type: 'SUBSCRIPTION_WARNING', title: 'Истекает подписка', message: 'Ваша подписка скоро истечет. Пожалуйста, продлите её, чтобы календарь оставался доступен пользователям.' }
      });
    }
  }
}
