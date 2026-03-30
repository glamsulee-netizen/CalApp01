// ============================================
// CalApp01 — Auth Routes
// ============================================
// POST /api/auth/register    — Регистрация
// POST /api/auth/login       — Вход
// POST /api/auth/refresh     — Обновление токена
// POST /api/auth/logout      — Выход
// POST /api/auth/change-password — Смена пароля
//
// AGENT_INSTRUCTION:
// 1. Регистрация:
//    - Проверить что регистрация открыта (PlatformSettings.registration_open)
//    - Валидировать email (Zod), пароль (мин 6 символов)
//    - Хешировать пароль через bcrypt (10 раундов)
//    - Создать User с ролью USER
//    - Вернуть accessToken + refreshToken (cookie httpOnly)
//
// 2. Логин:
//    - Найти пользователя по email
//    - Сравнить пароль через bcrypt.compare
//    - Если mustChangePassword=true — вернуть флаг в ответе
//    - Сгенерировать JWT accessToken (15 мин) и refreshToken (30 дней)
//    - refreshToken сохранить в Redis (userId → token) и отправить в httpOnly cookie
//
// 3. Refresh:
//    - Получить refreshToken из cookie
//    - Проверить валидность (jwt.verify)
//    - Проверить что токен есть в Redis
//    - Выдать новую пару токенов (rotation)
//
// 4. Logout:
//    - Удалить refreshToken из Redis
//    - Очистить cookie
//
// 5. Change Password:
//    - Требует авторизации (requireAuth)
//    - Принимает oldPassword и newPassword
//    - Для admin с mustChangePassword=true — oldPassword не обязателен

import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';

export const authRouter = Router();

// --- Zod-схемы валидации ---

const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль минимум 6 символов'),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Пароль минимум 6 символов'),
});

// --- Маршруты ---

// POST /api/auth/register
authRouter.post('/register', validate(registerSchema), async (req, res, next) => {
  // TODO: Реализовать регистрацию (см. auth.service.ts → registerUser)
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
authRouter.post('/login', validate(loginSchema), async (req, res, next) => {
  // TODO: Реализовать вход (см. auth.service.ts → loginUser)
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/refresh
authRouter.post('/refresh', async (req, res, next) => {
  // TODO: Реализовать обновление токена (см. auth.service.ts → refreshTokens)
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
authRouter.post('/logout', requireAuth, async (req, res, next) => {
  // TODO: Реализовать выход (см. auth.service.ts → logoutUser)
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/change-password
authRouter.post('/change-password', requireAuth, validate(changePasswordSchema), async (req, res, next) => {
  // TODO: Реализовать смену пароля (см. auth.service.ts → changePassword)
  try {
    res.status(501).json({ error: 'Не реализовано' });
  } catch (error) {
    next(error);
  }
});
