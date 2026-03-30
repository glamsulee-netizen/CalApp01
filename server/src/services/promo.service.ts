// ============================================
// CalApp01 — Promo Code Service
// ============================================
// AGENT_INSTRUCTION:
// Генерация и активация промокодов для подписки специалиста.

import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../index';
import { PlatformStats } from '../types';

/**
 * Генерация промокодов
 * 
 * AGENT_INSTRUCTION:
 * 1. Генерировать count уникальных 8-символьных кодов (A-Z, 0-9)
 * 2. Алгоритм: uuid().replace(/-/g, '').substring(0, 8).toUpperCase()
 * 3. Проверить уникальность (маловероятно, но стоит)
 * 4. prisma.promoCode.createMany()
 * 5. Вернуть массив созданных кодов
 * 
 * @param type — SUBSCRIPTION_MONTH (30 дней) / SUBSCRIPTION_YEAR (365 дней)
 * @param count — количество кодов для генерации (1-100)
 */
export async function generatePromoCodes(
  type: 'SUBSCRIPTION_MONTH' | 'SUBSCRIPTION_YEAR',
  count: number
): Promise<string[]> {
  const durationDays = type === 'SUBSCRIPTION_MONTH' ? 30 : 365;
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const code = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
    codes.push(code);
  }

  await prisma.promoCode.createMany({
    data: codes.map((code) => ({
      code,
      type,
      durationDays,
    })),
  });

  return codes;
}

/**
 * Активация промокода специалистом
 * 
 * AGENT_INSTRUCTION:
 * 1. Найти PromoCode по коду
 * 2. Проверить isUsed=false
 * 3. Получить/создать Calendar для userId
 * 4. Рассчитать новый subscriptionEnd:
 *    - Если текущий subscriptionEnd > NOW() → прибавить durationDays
 *    - Если текущий subscriptionEnd < NOW() или null → NOW() + durationDays
 * 5. Обновить Calendar.subscriptionEnd и isActive=true
 * 6. Обновить PromoCode: isUsed=true, usedById, activatedAt=NOW(), expiresAt
 * 7. Всё в транзакции
 */
export async function activatePromoCode(userId: number, code: string) {
  // TODO: Реализовать
  throw new Error('Не реализовано');
}

/**
 * Статистика платформы для админ-дашборда
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  const [totalUsers, totalSpecialists, activeCalendars, totalBookings, activeBookings, todayBookings] = 
    await Promise.all([
      prisma.user.count(),
      prisma.calendarMember.count({ where: { role: 'SPECIALIST' } }),
      prisma.calendar.count({ where: { isActive: true } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'ACTIVE' } }),
      prisma.booking.count({ 
        where: { 
          status: 'ACTIVE',
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

  return {
    totalUsers,
    totalSpecialists,
    activeCalendars,
    totalBookings,
    activeBookings,
    todayBookings,
  };
}
