// ============================================
// CalApp01 — JWT Authentication Middleware
// ============================================
// AGENT_INSTRUCTION:
// Этот middleware извлекает JWT из:
// 1. Authorization header: "Bearer <token>"
// 2. Если токен невалиден — возвращает 401
// Refresh token хранится в httpOnly cookie "refreshToken"

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthRequest, JwtPayload } from '../types';

/**
 * Middleware: требует валидный JWT Access Token
 * Добавляет req.user с данными из токена
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Требуется авторизация' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, config.jwtAccessSecret) as JwtPayload;
    
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Токен истёк', code: 'TOKEN_EXPIRED' });
      return;
    }
    res.status(401).json({ error: 'Невалидный токен' });
  }
}

/**
 * Middleware: опциональная авторизация
 * Если токен есть и валиден — добавляет req.user
 * Если нет — пропускает дальше без ошибки
 */
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = jwt.verify(token, config.jwtAccessSecret) as JwtPayload;
      req.user = payload;
    }
  } catch {
    // Игнорируем ошибки — пользователь просто не авторизован
  }
  next();
}
