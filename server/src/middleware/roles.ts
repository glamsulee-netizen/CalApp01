// ============================================
// CalApp01 — Role-based Access Middleware
// ============================================
// AGENT_INSTRUCTION:
// Используйте эти middleware ПОСЛЕ requireAuth.
// Примеры:
//   router.get('/admin/stats', requireAuth, requirePlatformRole('ADMIN'), handler);
//   router.post('/slots', requireAuth, requireCalendarRole('SPECIALIST'), handler);

import { Response, NextFunction } from 'express';
import { PlatformRole, CalendarRole } from '@prisma/client';
import { AuthRequest } from '../types';
import { prisma } from '../index';

/**
 * Проверяет роль пользователя на уровне платформы
 * @param roles — допустимые роли (например: 'ADMIN')
 */
export function requirePlatformRole(...roles: PlatformRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Требуется авторизация' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Недостаточно прав' });
      return;
    }

    next();
  };
}

/**
 * Проверяет роль пользователя в конкретном календаре
 * Ожидает calendarId в req.params.calendarId
 * @param roles — допустимые роли (SPECIALIST, CLIENT, ZOMBIE)
 * 
 * AGENT_INSTRUCTION: 
 * Также разрешает доступ владельцу календаря (calendar.ownerId === userId)
 * и ADMIN платформы.
 */
export function requireCalendarRole(...roles: CalendarRole[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Требуется авторизация' });
      return;
    }

    const calendarId = parseInt(req.params.calendarId, 10);
    if (isNaN(calendarId)) {
      res.status(400).json({ error: 'Некорректный ID календаря' });
      return;
    }

    // Админ платформы имеет доступ ко всему
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    // Проверяем владельца календаря
    const calendar = await prisma.calendar.findUnique({
      where: { id: calendarId },
      select: { ownerId: true },
    });

    if (!calendar) {
      res.status(404).json({ error: 'Календарь не найден' });
      return;
    }

    if (calendar.ownerId === req.user.id) {
      next();
      return;
    }

    // Проверяем членство в календаре
    const member = await prisma.calendarMember.findUnique({
      where: {
        calendarId_userId: {
          calendarId,
          userId: req.user.id,
        },
      },
    });

    if (!member || !roles.includes(member.role)) {
      res.status(403).json({ error: 'Недостаточно прав для этого календаря' });
      return;
    }

    next();
  };
}
