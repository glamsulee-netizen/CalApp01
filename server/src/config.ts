// ============================================
// CalApp01 Server — Конфигурация
// ============================================
// Загружает все переменные окружения с валидацией.
// AGENT_INSTRUCTION: Все значения из .env доступны через объект `config`.
// Не обращайтесь к process.env напрямую из других файлов.

import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[Config] Обязательная переменная ${key} не задана`);
  }
  return value;
}

function optional(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export const config = {
  // --- Сервер ---
  serverPort: parseInt(optional('SERVER_PORT', '3000'), 10),
  nodeEnv: optional('NODE_ENV', 'development'),
  appUrl: optional('APP_URL', 'http://localhost:3000'),
  corsOrigin: optional('CORS_ORIGIN', 'http://localhost:5173'),

  // --- БД ---
  databaseUrl: required('DATABASE_URL'),

  // --- Redis ---
  redisUrl: optional('REDIS_URL', 'redis://localhost:6379'),

  // --- JWT ---
  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  jwtAccessExpiresIn: optional('JWT_ACCESS_EXPIRES_IN', '15m'),
  jwtRefreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '30d'),

  // --- SMTP (основной) ---
  smtpHost: optional('SMTP_HOST', ''),
  smtpPort: parseInt(optional('SMTP_PORT', '587'), 10),
  smtpUser: optional('SMTP_USER', ''),
  smtpPassword: optional('SMTP_PASSWORD', ''),
  smtpFrom: optional('SMTP_FROM', 'noreply@example.com'),
  smtpDailyLimit: parseInt(optional('SMTP_DAILY_LIMIT', '300'), 10),

  // --- SMTP (резервный) ---
  smtpBackupHost: optional('SMTP_BACKUP_HOST', ''),
  smtpBackupPort: parseInt(optional('SMTP_BACKUP_PORT', '587'), 10),
  smtpBackupUser: optional('SMTP_BACKUP_USER', ''),
  smtpBackupPassword: optional('SMTP_BACKUP_PASSWORD', ''),
  smtpBackupFrom: optional('SMTP_BACKUP_FROM', ''),
  smtpBackupDailyLimit: parseInt(optional('SMTP_BACKUP_DAILY_LIMIT', '500'), 10),

  // --- Web Push (VAPID) ---
  vapidPublicKey: optional('VAPID_PUBLIC_KEY', ''),
  vapidPrivateKey: optional('VAPID_PRIVATE_KEY', ''),
  vapidEmail: optional('VAPID_EMAIL', 'mailto:admin@example.com'),

  // --- Админ ---
  adminEmail: optional('ADMIN_EMAIL', 'admin@calapp.local'),
  adminDefaultPassword: optional('ADMIN_DEFAULT_PASSWORD', ''),

  // --- Платформа ---
  registrationOpen: optional('REGISTRATION_OPEN', 'true') === 'true',
  defaultCalendarStartHour: parseInt(optional('DEFAULT_CALENDAR_START_HOUR', '8'), 10),
  defaultCalendarEndHour: parseInt(optional('DEFAULT_CALENDAR_END_HOUR', '22'), 10),
  defaultSlotDuration: parseInt(optional('DEFAULT_SLOT_DURATION', '60'), 10),
} as const;
