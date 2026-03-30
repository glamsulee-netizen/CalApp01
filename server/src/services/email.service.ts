// ============================================
// CalApp01 — Email Service (Multi-SMTP Failover)
// ============================================
// AGENT_INSTRUCTION:
// Отправка email через несколько SMTP-провайдеров с автоматическим переключением.
// Алгоритм:
// 1. Получить всех активных SMTP-провайдеров из БД, отсортированных по priority ASC
// 2. Для каждого провайдера проверить sentToday < dailyLimit
// 3. Если нашёлся — отправить через него, инкрементировать sentToday
// 4. Если все исчерпаны — добавить в EmailQueue(PENDING)
// 5. Cron-задача (каждые 5 мин) обрабатывает очередь
// 6. Cron-задача (ежедневно в 00:00) сбрасывает sentToday всем провайдерам
//
// При первом запуске: если в БД нет провайдеров — создать из .env конфига

import nodemailer, { Transporter } from 'nodemailer';
import { prisma } from '../index';
import { config } from '../config';

/**
 * Инициализация SMTP-провайдеров из .env (при первом запуске)
 * 
 * AGENT_INSTRUCTION:
 * Вызывать из index.ts при старте сервера.
 * 1. Проверить кол-во SmtpProvider в БД
 * 2. Если 0 — создать из конфига:
 *    - Основной: config.smtpHost (priority=0)
 *    - Резервный: config.smtpBackupHost (priority=1)
 * 3. Пароли зашифровать (AES-256 или просто хранить как есть на первом этапе)
 */
export async function initSmtpProviders(): Promise<void> {
  const count = await prisma.smtpProvider.count();
  if (count > 0) return;

  const providers = [];

  if (config.smtpHost) {
    providers.push({
      name: 'Основной (Brevo)',
      host: config.smtpHost,
      port: config.smtpPort,
      user: config.smtpUser,
      password: config.smtpPassword,
      fromEmail: config.smtpFrom,
      dailyLimit: config.smtpDailyLimit,
      priority: 0,
    });
  }

  if (config.smtpBackupHost) {
    providers.push({
      name: 'Резервный (Gmail)',
      host: config.smtpBackupHost,
      port: config.smtpBackupPort,
      user: config.smtpBackupUser,
      password: config.smtpBackupPassword,
      fromEmail: config.smtpBackupFrom,
      dailyLimit: config.smtpBackupDailyLimit,
      priority: 1,
    });
  }

  if (providers.length > 0) {
    await prisma.smtpProvider.createMany({ data: providers });
    console.log(`[Email] Инициализировано ${providers.length} SMTP-провайдеров`);
  }
}

/**
 * Отправка email с failover
 * 
 * AGENT_INSTRUCTION:
 * 1. Получить активных провайдеров (isActive=true) ORDER BY priority ASC
 * 2. Для каждого: if sentToday < dailyLimit → попробовать отправить
 * 3. При успехе: INCREMENT sentToday, return
 * 4. При ошибке: логировать, перейти к следующему провайдеру
 * 5. Если все провайдеры исчерпаны/ошиблись → EmailQueue(PENDING)
 */
export async function attemptSend(toEmail: string, subject: string, body: string): Promise<boolean> {
  const providers = await prisma.smtpProvider.findMany({
    where: { isActive: true },
    orderBy: { priority: 'asc' },
  });

  for (const provider of providers) {
    if (provider.sentToday >= provider.dailyLimit) {
      continue;
    }

    try {
      const transporter = createTransporter(provider as any);
      await transporter.sendMail({
        from: provider.fromEmail,
        to: toEmail,
        subject,
        html: body,
      });

      await prisma.smtpProvider.update({
        where: { id: provider.id },
        data: { sentToday: { increment: 1 } },
      });

      console.log(`[Email] Отправлено через "${provider.name}" на ${toEmail}`);
      return true;
    } catch (error: any) {
      console.error(`[Email] Ошибка "${provider.name}":`, error.message);
      continue;
    }
  }
  return false;
}

export async function sendEmail(toEmail: string, subject: string, body: string): Promise<boolean> {
  const success = await attemptSend(toEmail, subject, body);
  if (!success) {
    await prisma.emailQueue.create({
      data: { toEmail, subject, body },
    });
    console.log(`[Email] Добавлено в очередь: ${toEmail} — "${subject}"`);
  }
  return success;
}

export async function processEmailQueue(): Promise<void> {
  const pendingEmails = await prisma.emailQueue.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  for (const email of pendingEmails) {
    const success = await attemptSend(email.toEmail, email.subject, email.body);
    if (success) {
      await prisma.emailQueue.update({
        where: { id: email.id },
        data: { status: 'SENT', sentAt: new Date() }
      });
    } else {
      const attempts = email.attempts + 1;
      await prisma.emailQueue.update({
        where: { id: email.id },
        data: {
          attempts,
          status: attempts >= email.maxAttempts ? 'FAILED' : 'PENDING',
          error: attempts >= email.maxAttempts ? 'Лимиты SMTP исчерпаны' : null,
        }
      });
    }
  }
}

/**
 * Сброс дневных счётчиков (вызывается ежедневно в 00:00 из cron)
 */
export async function resetDailyCounters(): Promise<void> {
  await prisma.smtpProvider.updateMany({
    data: {
      sentToday: 0,
      lastResetAt: new Date(),
    },
  });
  console.log('[Email] Дневные счётчики SMTP сброшены');
}

// --- Helpers ---

function createTransporter(provider: { host: string; port: number; user: string; password: string }): Transporter {
  return nodemailer.createTransport({
    host: provider.host,
    port: provider.port,
    secure: provider.port === 465,
    auth: {
      user: provider.user,
      pass: provider.password,
    },
  });
}
