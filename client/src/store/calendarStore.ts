// ============================================
// CalApp01 — Calendar Store (Zustand)
// ============================================
// AGENT_INSTRUCTION:
// Состояние просмотра календаря.
// Хранит текущий календарь, слоты недели, выбранный слот,
// подписки (несколько календарей), и real-time обновления.

import { create } from 'zustand';
import { apiGet, apiPost, apiDelete } from '../api';
import { joinCalendar, leaveCalendar, getCurrentSocket } from '../api/socket';

interface SlotData {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  isOpen: boolean;
  isBooked: boolean;
  booking?: {
    id: number;
    userName: string;
    userPhone: string;
    userMessenger: string;
    userMessengerType: string;
    isPaid: boolean;
    status: string;
  };
}

interface CalendarData {
  id: number;
  title: string;
  code: string;
  shareLink: string;
  startHour: number;
  endHour: number;
  slotDuration: number;
  workDays: number[];
  colorScheme: Record<string, string>;
  bgImage: string;
  paymentLink: string;
  ownerName: string;
  isActive: boolean;
}

interface UpcomingBooking {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  calendarTitle: string;
}

interface CalendarState {
  // Текущий календарь
  currentCalendar: CalendarData | null;
  slots: SlotData[];
  weekStart: Date;
  selectedSlotId: number | null;

  // Подписки (несколько календарей)
  subscriptions: CalendarData[];
  
  // Ближайшая запись
  upcomingBooking: UpcomingBooking | null;

  // Loading
  isLoading: boolean;
  error: string | null;

  // Actions
  loadCalendar: (calendarId: number) => Promise<void>;
  loadCalendarByShare: (shareLink: string) => Promise<void>;
  loadSubscriptions: () => Promise<void>;
  subscribeToCalendar: (code: string) => Promise<void>;
  activatePromo: (code: string) => Promise<void>;
  loadWeekSlots: (calendarId: number, weekStart: Date) => Promise<void>;
  loadUpcoming: () => Promise<void>;
  setWeek: (weekStart: Date) => void;
  selectSlot: (slotId: number | null) => void;
  nextWeek: () => void;
  prevWeek: () => void;
  switchCalendar: (calendarId: number) => void;
  bookSlot: (slotId: number) => Promise<void>;
  cancelBooking: (bookingId: number) => Promise<void>;
  subscribeSocket: (calendarId: number) => void;
  unsubscribeSocket: (calendarId: number) => void;
}

// AGENT_INSTRUCTION:
// Реализовать store с полным lifecycle:
// 1. loadCalendar / loadCalendarByShare: GET /api/calendar/:id или /share/:link
// 2. loadWeekSlots: GET /api/calendar/:id/slots?week=YYYY-MM-DD
// 3. bookSlot: POST /api/booking { slotId, calendarId }
// 4. cancelBooking: DELETE /api/booking/:id
// 5. subscribeSocket: joinCalendar(), подписка на socket events
//    socket.on('slot:updated') → обновить слот в массиве
//    socket.on('booking:created') → пометить слот как забронированный
//    socket.on('booking:cancelled') → пометить слот как свободный
// 6. nextWeek/prevWeek: изменить weekStart и перезагрузить слоты

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  currentCalendar: null,
  slots: [],
  weekStart: getMonday(new Date()),
  selectedSlotId: null,
  subscriptions: [],
  upcomingBooking: null,
  isLoading: false,
  error: null,

  loadCalendar: async (calendarId) => {
    // TODO: Реализовать
    set({ isLoading: false });
  },

  loadCalendarByShare: async (shareLink) => {
    // TODO: Реализовать
    set({ isLoading: false });
  },

  loadSubscriptions: async () => {
    try {
      set({ isLoading: true, error: null });
      const subscriptions = await apiGet<CalendarData[]>('/calendar/subscriptions');
      set({ subscriptions, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  subscribeToCalendar: async (code: string) => {
    try {
      set({ isLoading: true, error: null });
      await apiPost('/calendar/subscribe', { code });
      await get().loadSubscriptions();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  activatePromo: async (code: string) => {
    try {
      set({ isLoading: true, error: null });
      await apiPost('/calendar/activate', { code });
      await get().loadSubscriptions();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  loadWeekSlots: async (calendarId, weekStart) => {
    // TODO: GET /api/calendar/:id/slots?week=...
    set({ isLoading: false });
  },

  loadUpcoming: async () => {
    // TODO: GET /api/booking/upcoming
  },

  setWeek: (weekStart) => set({ weekStart }),

  selectSlot: (slotId) => set({ selectedSlotId: slotId }),

  nextWeek: () => {
    const { weekStart, currentCalendar } = get();
    const next = new Date(weekStart);
    next.setDate(next.getDate() + 7);
    set({ weekStart: next, selectedSlotId: null });
    if (currentCalendar) {
      get().loadWeekSlots(currentCalendar.id, next);
    }
  },

  prevWeek: () => {
    const { weekStart, currentCalendar } = get();
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);
    set({ weekStart: prev, selectedSlotId: null });
    if (currentCalendar) {
      get().loadWeekSlots(currentCalendar.id, prev);
    }
  },

  switchCalendar: (calendarId) => {
    const { currentCalendar, subscriptions, weekStart } = get();
    if (currentCalendar) {
      get().unsubscribeSocket(currentCalendar.id);
    }
    const calendar = subscriptions.find((s) => s.id === calendarId);
    if (calendar) {
      set({ currentCalendar: calendar, selectedSlotId: null });
      get().loadWeekSlots(calendarId, weekStart);
      get().subscribeSocket(calendarId);
    }
  },

  bookSlot: async (slotId) => {
    // TODO: POST /api/booking + обработка ответа
  },

  cancelBooking: async (bookingId) => {
    // TODO: DELETE /api/booking/:id
  },

  subscribeSocket: (calendarId) => {
    joinCalendar(calendarId);
    const socket = getCurrentSocket();
    if (!socket) return;

    // AGENT_INSTRUCTION: Добавить слушатели событий
    socket.on('slot:updated', (slot: SlotData) => {
      set((state) => ({
        slots: state.slots.map((s) => (s.id === slot.id ? slot : s)),
      }));
    });

    socket.on('booking:created', (data: { slotId: number }) => {
      set((state) => ({
        slots: state.slots.map((s) =>
          s.id === data.slotId ? { ...s, isBooked: true } : s
        ),
      }));
    });

    socket.on('booking:cancelled', (data: { slotId: number }) => {
      set((state) => ({
        slots: state.slots.map((s) =>
          s.id === data.slotId ? { ...s, isBooked: false } : s
        ),
      }));
    });
  },

  unsubscribeSocket: (calendarId) => {
    leaveCalendar(calendarId);
    const socket = getCurrentSocket();
    if (socket) {
      socket.off('slot:updated');
      socket.off('booking:created');
      socket.off('booking:cancelled');
    }
  },
}));
