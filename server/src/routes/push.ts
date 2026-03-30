// ============================================
// CalApp01 — Push Notification Routes
// ============================================
// POST   /api/push/subscribe      — Подписаться на push-уведомления
// DELETE /api/push/unsubscribe    — Отписаться
// GET    /api/push/vapid-key      — Получить VAPID public key
//
// AGENT_INSTRUCTION:
// - subscribe: Сохраняет PushSubscription (endpoint + keys) для текущего пользователя
//   Один пользователь может иметь несколько подписок (разные устройства)
// - unsubscribe: Удаляет PushSubscription по endpoint
// - vapid-key: Возвращает публичный VAPID-ключ для клиентского JS

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { config } from '../config';
import { savePushSubscription, removePushSubscription } from '../services/push.service';
import { AuthRequest } from '../types';

export const pushRouter = Router();

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

// GET /api/push/vapid-key
pushRouter.get('/vapid-key', (req: Request, res: Response) => {
  if (!config.vapidPublicKey) {
    return res.status(500).json({ error: 'VAPID key not configured' });
  }
  res.json({ vapidPublicKey: config.vapidPublicKey });
});

// POST /api/push/subscribe
pushRouter.post('/subscribe', requireAuth, validate(subscribeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const { endpoint, keys } = req.body;
    await savePushSubscription(authReq.user.id, endpoint, keys);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/push/unsubscribe
pushRouter.delete('/unsubscribe', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const endpoint = req.query.endpoint as string;
    if (endpoint) {
      await removePushSubscription(endpoint);
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});
