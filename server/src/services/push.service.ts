// ============================================
// CalApp01 — Push Notification Service
// ============================================
// AGENT_INSTRUCTION:
// Web Push через VAPID. Используется библиотека `web-push`.
// При ошибке 410 (Gone) — удалить подписку из БД (устройство отписалось).

import webPush from 'web-push';
import { prisma } from '../index';
import { config } from '../config';

// Инициализация VAPID
if (config.vapidPublicKey && config.vapidPrivateKey) {
  webPush.setVapidDetails(
    config.vapidEmail,
    config.vapidPublicKey,
    config.vapidPrivateKey
  );
}

/**
 * Отправить push-уведомление конкретному пользователю
 * 
 * AGENT_INSTRUCTION:
 * 1. Найти все PushSubscription для userId
 * 2. Для каждой подписки: webPush.sendNotification(subscription, payload)
 * 3. При ошибке 410 (Gone) — удалить подписку
 * 4. Логировать ошибки, не прерывать выполнение
 */
export async function sendPushToUser(userId: number, title: string, body: string, data?: object): Promise<void> {
  if (!config.vapidPublicKey) {
    console.log('[Push] VAPID не настроен, пропускаем');
    return;
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  const payload = JSON.stringify({
    title,
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: data || {},
  });

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys as { p256dh: string; auth: string },
        },
        payload
      );
    } catch (error: any) {
      if (error.statusCode === 410) {
        // Подписка недействительна — удаляем
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
        console.log(`[Push] Удалена недействительная подписка ${sub.id}`);
      } else {
        console.error(`[Push] Ошибка отправки для ${sub.endpoint}:`, error.message);
      }
    }
  }
}

/**
 * Отправить push всем специалистам календаря
 * 
 * AGENT_INSTRUCTION:
 * Найти всех CalendarMember(role=SPECIALIST) + Calendar.owner
 * и отправить им push
 */
export async function sendPushToCalendarSpecialists(calendarId: number, title: string, body: string) {
  const calendar = await prisma.calendar.findUnique({
    where: { id: calendarId },
    include: {
      members: {
        where: { role: 'SPECIALIST' },
        select: { userId: true },
      },
    },
  });

  if (!calendar) return;

  // Push владельцу
  await sendPushToUser(calendar.ownerId, title, body, { calendarId });

  // Push со-специалистам
  for (const member of calendar.members) {
    if (member.userId !== calendar.ownerId) {
      await sendPushToUser(member.userId, title, body, { calendarId });
    }
  }
}

/**
 * Сохранить push-подписку
 */
export async function savePushSubscription(userId: number, endpoint: string, keys: { p256dh: string; auth: string }) {
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId, endpoint, keys },
    update: { userId, keys },
  });
}

/**
 * Удалить push-подписку
 */
export async function removePushSubscription(endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}
