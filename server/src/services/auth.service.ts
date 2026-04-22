// ============================================
// CalApp01 — Auth Service
// ============================================
// AGENT_INSTRUCTION:
// Вся бизнес-логика аутентификации. Вызывается из routes/auth.ts.
// Методы:
//   seedAdmin()       — Создание admin при первом запуске
//   registerUser()    — Регистрация нового пользователя
//   loginUser()       — Вход
//   refreshTokens()   — Обновление пары токенов
//   logoutUser()      — Выход (удаление refresh из Redis)
//   changePassword()  — Смена пароля
//   generateTokens()  — Генерация JWT пары (internal)

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, redis } from '../index';
import { config } from '../config';
import { JwtPayload, AuthResponse } from '../types';

const BCRYPT_ROUNDS = 10;
const REFRESH_TOKEN_PREFIX = 'refresh:'; // Redis key: refresh:{userId}

/**
 * Создание admin-пользователя при первом запуске системы.
 * Вызывается из index.ts при старте сервера.
 * 
 * AGENT_INSTRUCTION:
 * 1. Проверить существует ли пользователь с role=ADMIN
 * 2. Если нет — создать с email из config.adminEmail, пустой пароль
 * 3. Установить mustChangePassword=true
 * 4. Логировать в консоль что admin создан
 */
export async function seedAdmin(): Promise<void> {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(config.adminDefaultPassword || '', BCRYPT_ROUNDS);
    await prisma.user.create({
      data: {
        email: config.adminEmail,
        password: hashedPassword,
        name: 'Администратор',
        role: 'ADMIN',
        mustChangePassword: true,
      },
    });
    console.log(`[Seed] Admin создан: ${config.adminEmail}`);
  }
}

/**
 * Генерация пары JWT токенов
 */
export function generateTokens(payload: JwtPayload): { accessToken: string; refreshToken: string } {
  const accessToken = jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpiresIn,
  });
  const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn,
  });
  return { accessToken, refreshToken };
}

/**
 * Регистрация нового пользователя
 * AGENT_INSTRUCTION:
 * 1. Проверить PlatformSettings.registration_open
 * 2. Проверить что email не занят
 * 3. Захешировать пароль
 * 4. Создать User(role=USER)
 * 5. Вернуть токены + данные пользователя
 */
export async function registerUser(email: string, password: string, name?: string): Promise<AuthResponse> {
  const settings = await prisma.platformSettings.findFirst({ where: { key: 'registration_open' } });
  if (settings && settings.value === 'false') {
    throw new Error('Регистрация закрыта администратором');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('Пользователь с таким email уже существует');
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: name || '',
      phone: '',
      messenger: '',
      messengerType: 'telegram',
      role: 'USER',
    },
  });

  const payload: JwtPayload = { id: user.id, email: user.email, role: user.role };
  const tokens = generateTokens(payload);
  
  const ttl = 30 * 24 * 60 * 60; // 30 days
  await redis.set(`${REFRESH_TOKEN_PREFIX}${user.id}`, tokens.refreshToken, { EX: ttl });

  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword as any, ...tokens };
}

/**
 * Вход пользователя
 * AGENT_INSTRUCTION:
 * 1. Найти пользователя по email
 * 2. Сравнить пароли через bcrypt
 * 3. Сгенерировать токены
 * 4. Сохранить refresh token в Redis (SETEX refresh:{userId} ttl token)
 * 5. Вернуть данные + токены
 */
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('Неверный email или пароль');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Неверный email или пароль');
  }

  const payload: JwtPayload = { id: user.id, email: user.email, role: user.role };
  const tokens = generateTokens(payload);
  
  const ttl = 30 * 24 * 60 * 60; 
  await redis.set(`${REFRESH_TOKEN_PREFIX}${user.id}`, tokens.refreshToken, { EX: ttl });

  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword as any, ...tokens };
}

/**
 * Обновление токенов
 * AGENT_INSTRUCTION:
 * 1. Верифицировать refreshToken через jwt.verify
 * 2. Проверить что токен есть в Redis (GET refresh:{userId})
 * 3. Сгенерировать новую пару (token rotation)
 * 4. Обновить refresh в Redis
 */
export async function refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; user: any }> {
  try {
    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as JwtPayload;
    if (!decoded.id) throw new Error('Неверный токен');

    const redisToken = await redis.get(`${REFRESH_TOKEN_PREFIX}${decoded.id}`);
    
    if (redisToken !== refreshToken) {
      throw new Error('Токен недействителен или устарел');
    }

    // Fetch fresh user data from DB
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) throw new Error('Пользователь не найден');

    const payload: JwtPayload = { id: user.id, email: user.email, role: user.role };
    const tokens = generateTokens(payload);

    const ttl = 30 * 24 * 60 * 60;
    await redis.set(`${REFRESH_TOKEN_PREFIX}${user.id}`, tokens.refreshToken, { EX: ttl });

    const { password: _, ...userWithoutPassword } = user;
    return { ...tokens, user: userWithoutPassword };
  } catch (error) {
    throw new Error('Невалидный или просроченный refresh token');
  }
}

/**
 * Выход — удаление refresh token из Redis
 */
export async function logoutUser(userId: number): Promise<void> {
  await redis.del(`${REFRESH_TOKEN_PREFIX}${userId}`);
}

/**
 * Смена пароля
 * AGENT_INSTRUCTION:
 * 1. Если mustChangePassword=false — проверить oldPassword
 * 2. Захешировать newPassword
 * 3. Обновить пароль и mustChangePassword=false
 * 4. Инвалидировать все refresh tokens (удалить из Redis)
 */
export async function changePassword(userId: number, oldPassword: string | undefined, newPassword: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Пользователь не найден');

  if (!user.mustChangePassword) {
    if (!oldPassword) throw new Error('Требуется старый пароль');
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new Error('Неверный старый пароль');
  }

  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword, mustChangePassword: false }
  });

  await logoutUser(userId);
}
