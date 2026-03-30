// ============================================
// CalApp01 — Socket.IO Client
// ============================================
// AGENT_INSTRUCTION:
// Синглтон подключения к Socket.IO серверу.
// Автоматически передаёт JWT при подключении.
// Реэкспортирует удобные хуки для React.

import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || '';

let socket: Socket | null = null;

/**
 * Получить/создать Socket.IO подключение
 * AGENT_INSTRUCTION:
 * Вызывается при логине. Передаёт JWT в handshake.
 */
export function getSocket(token?: string): Socket {
  if (socket?.connected) return socket;

  socket = io(WS_URL, {
    auth: token ? { token: `Bearer ${token}` } : {},
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Подключено:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Отключено:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Ошибка подключения:', error.message);
  });

  return socket;
}

/**
 * Присоединиться к комнате календаря
 */
export function joinCalendar(calendarId: number): void {
  socket?.emit('join:calendar', { calendarId });
}

/**
 * Покинуть комнату календаря
 */
export function leaveCalendar(calendarId: number): void {
  socket?.emit('leave:calendar', { calendarId });
}

/**
 * Отключить Socket.IO (при логауте)
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Получить текущий инстанс (для подписки на события)
 */
export function getCurrentSocket(): Socket | null {
  return socket;
}
