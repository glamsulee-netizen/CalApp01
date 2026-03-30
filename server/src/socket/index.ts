// ============================================
// CalApp01 — Socket.IO Handlers
// ============================================
// AGENT_INSTRUCTION:
// WebSocket для real-time обновлений календаря.
// Используем rooms: `calendar:{calendarId}` — все участники календаря.
// 
// Клиент при подключении присылает:
//   socket.emit('join:calendar', { calendarId })
// 
// Сервер отправляет события:
//   socket.to(`calendar:${id}`).emit('slot:updated', slotData)
//   socket.to(`calendar:${id}`).emit('booking:created', bookingData)
//   socket.to(`calendar:${id}`).emit('booking:cancelled', bookingData)
//
// Аутентификация:
// Клиент передаёт JWT в handshake: { auth: { token: 'Bearer xxx' } }
// Middleware проверяет токен перед подключением.

import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types';
import { prisma } from '../index';

interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

export function setupSocketHandlers(io: SocketIOServer): void {
  // --- Middleware: JWT аутентификация ---
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token;
    
    if (!token) {
      // Разрешаем анонимное подключение (для публичных календарей)
      return next();
    }

    try {
      const payload = jwt.verify(
        token.replace('Bearer ', ''), 
        config.jwtAccessSecret
      ) as JwtPayload;
      socket.user = payload;
      next();
    } catch (err) {
      next(new Error('Ошибка аутентификации'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`[Socket] Подключение: ${socket.user?.email || 'аноним'} (${socket.id})`);

    // --- Присоединиться к комнате календаря ---
    socket.on('join:calendar', async (data: { calendarId: number }) => {
      const { calendarId } = data;
      
      // AGENT_INSTRUCTION:
      // Проверить что пользователь имеет доступ к календарю:
      // 1. Календарь существует и isActive
      // 2. Пользователь — участник (CalendarMember) ИЛИ календарь публичный
      // Для анонимов — разрешаем если подключились по shareLink
      
      const room = `calendar:${calendarId}`;
      socket.join(room);
      console.log(`[Socket] ${socket.user?.email || 'аноним'} → ${room}`);
    });

    // --- Покинуть комнату ---
    socket.on('leave:calendar', (data: { calendarId: number }) => {
      const room = `calendar:${data.calendarId}`;
      socket.leave(room);
    });

    // --- Отключение ---
    socket.on('disconnect', () => {
      console.log(`[Socket] Отключение: ${socket.user?.email || 'аноним'} (${socket.id})`);
    });
  });

  console.log('[Socket.IO] Обработчики настроены');
}
