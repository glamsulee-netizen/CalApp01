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
import { registerUser, loginUser, refreshTokens, logoutUser, changePassword } from '../services/auth.service';

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
  try {
    const { email, password, name } = req.body;
    const result = await registerUser(email, password, name);

    // Refresh token в httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
      path: '/',
    });

    res.status(201).json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error: any) {
    if (error.message.includes('уже существует') || error.message.includes('закрыта')) {
      res.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// POST /api/auth/login
authRouter.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);

    // Refresh token в httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // вместо true
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error: any) {
    if (error.message.includes('Неверный')) {
      res.status(401).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// POST /api/auth/refresh
authRouter.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({ error: 'Refresh token отсутствует' });
      return;
    }
    const tokens = await refreshTokens(token);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.json({ accessToken: tokens.accessToken });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', requireAuth, async (req: any, res, next) => {
  try {
    await logoutUser(req.user.id);
    res.clearCookie('refreshToken', { path: '/' });
    res.json({ message: 'Выход выполнен' });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/change-password
authRouter.post('/change-password', requireAuth, validate(changePasswordSchema), async (req: any, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    await changePassword(req.user.id, oldPassword, newPassword);
    res.clearCookie('refreshToken', { path: '/' });
    res.json({ message: 'Пароль изменён. Войдите заново.' });
  } catch (error: any) {
    if (error.message.includes('Неверный') || error.message.includes('Требуется')) {
      res.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});

