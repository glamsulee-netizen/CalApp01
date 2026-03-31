// ============================================
// CalApp01 Server — Типы и интерфейсы
// ============================================
// AGENT_INSTRUCTION: Все общие типы для серверной части.
// Импортировать: import { ... } from '@/types';

import { Request } from 'express';
import { PlatformRole, CalendarRole, BookingStatus } from '@prisma/client';

// Re-export Prisma enums для удобства
export { PlatformRole, CalendarRole, BookingStatus };

// ============================================
// AUTH
// ============================================

/** Payload JWT токена */
export interface JwtPayload {
  id: number;
  email: string;
  role: PlatformRole;
}

/** Express Request с добавленными данными пользователя */
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/** Тело запроса регистрации */
export interface RegisterBody {
  email: string;
  password: string;
  name?: string;
}

/** Тело запроса входа */
export interface LoginBody {
  email: string;
  password: string;
}

/** Ответ на успешную авторизацию */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: PlatformRole;
    mustChangePassword: boolean;
  };
}

// ============================================
// CALENDAR
// ============================================

/** Настройки внешнего вида календаря */
export interface ColorScheme {
  primary?: string;    // Основной цвет
  secondary?: string;  // Вторичный цвет
  accent?: string;     // Акцентный цвет
  bg?: string;         // Фон
  slotOpen?: string;   // Цвет открытого слота
  slotClosed?: string; // Цвет закрытого слота
  slotBooked?: string; // Цвет забронированного слота
  textPrimary?: string;
  textSecondary?: string;
}

/** Создание/обновление календаря */
export interface CalendarUpdateBody {
  title?: string;
  startHour?: number;
  endHour?: number;
  slotDuration?: number;
  workDays?: number[];
  colorScheme?: ColorScheme;
  bgImage?: string;
  paymentLink?: string;
}

/** Календарь для отображения пользователю */
export interface CalendarPublicView {
  id: number;
  title: string;
  code: string;
  shareLink: string;
  startHour: number;
  endHour: number;
  slotDuration: number;
  workDays: number[];
  colorScheme: ColorScheme;
  bgImage: string;
  paymentLink: string;
  ownerName: string;
  isActive: boolean;
}

// ============================================
// SLOTS
// ============================================

/** Создание слота */
export interface CreateSlotBody {
  date: string;      // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}

/** Обновление слота (toggle open/close) */
export interface UpdateSlotBody {
  isOpen?: boolean;
  endTime?: string; // Для touch-resize
}

/** Слот для отображения */
export interface SlotView {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  isOpen: boolean;
  isBooked: boolean;
  /** Данные о бронировании (видны только специалисту) */
  booking?: {
    id: number;
    userName: string;
    userPhone: string;
    userMessenger: string;
    userMessengerType: string;
    isPaid: boolean;
    status: BookingStatus;
  };
}

// ============================================
// BOOKING
// ============================================

/** Создание бронирования */
export interface CreateBookingBody {
  slotId: number;
  calendarId: number;
}

/** Перенос бронирования */
export interface MoveBookingBody {
  newSlotId: number;
}

/** Бронирование для отображения */
export interface BookingView {
  id: number;
  slotId: number;
  calendarId: number;
  calendarTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  isPaid: boolean;
  status: BookingStatus;
  specialistName: string;
}

// ============================================
// ADMIN
// ============================================

/** Генерация промокодов */
export interface GeneratePromoBody {
  type: 'SUBSCRIPTION_MONTH' | 'SUBSCRIPTION_YEAR';
  count: number; // Количество кодов для генерации
}

/** Статистика платформы */
export interface PlatformStats {
  totalUsers: number;
  totalSpecialists: number;
  activeCalendars: number;
  totalBookings: number;
  activeBookings: number;
  todayBookings: number;
}

/** Управление пользователем (админ) */
export interface AdminUserUpdateBody {
  role?: PlatformRole;
  isActive?: boolean;
}

// ============================================
// SMTP
// ============================================

/** Создание/обновление SMTP-провайдера (из интерфейса админа) */
export interface SmtpProviderBody {
  name: string;
  host: string;
  port: number;
  user: string;
  password: string;
  fromEmail: string;
  dailyLimit: number;
  priority: number;
  isActive?: boolean;
}

// ============================================
// CALENDAR MEMBER
// ============================================

/** Обновление роли участника календаря */
export interface UpdateMemberBody {
  role?: CalendarRole;
  maxBookings?: number;
}

/** Участник календаря для отображения */
export interface MemberView {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  userMessenger: string;
  userMessengerType: string;
  role: CalendarRole;
  maxBookings: number;
  activeBookings: number;
}

// ============================================
// PUSH
// ============================================

/** Подписка на push-уведомления */
export interface PushSubscriptionBody {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// ============================================
// WEBSOCKET EVENTS
// ============================================

/** События отправляемые через Socket.IO */
export interface SocketEvents {
  // Сервер → клиент
  'slot:created': (slot: SlotView) => void;
  'slot:updated': (slot: SlotView) => void;
  'slot:deleted': (slotId: number) => void;
  'booking:created': (data: { slotId: number; calendarId: number }) => void;
  'booking:cancelled': (data: { slotId: number; calendarId: number }) => void;
  'booking:moved': (data: { oldSlotId: number; newSlotId: number; calendarId: number }) => void;
  'notification:new': (notification: { type: string; message: string }) => void;
}
