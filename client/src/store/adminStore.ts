import { create } from 'zustand';
import { apiGet, apiPost } from '../api';

export interface PlatformStats {
  totalUsers: number;
  totalSpecialists: number;
  activeCalendars: number;
  totalBookings: number;
  activeBookings: number;
  todayBookings: number;
}

export interface PromoCode {
  id: number;
  code: string;
  type: 'SUBSCRIPTION_MONTH' | 'SUBSCRIPTION_YEAR';
  durationDays: number;
  isUsed: boolean;
  usedById: number | null;
  activatedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface AdminState {
  stats: PlatformStats | null;
  promos: PromoCode[];
  isLoading: boolean;
  error: string | null;

  loadStats: () => Promise<void>;
  loadPromos: () => Promise<void>;
  generatePromos: (type: 'SUBSCRIPTION_MONTH' | 'SUBSCRIPTION_YEAR', count: number) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  stats: null,
  promos: [],
  isLoading: false,
  error: null,

  loadStats: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await apiGet<PlatformStats>('/admin/stats');
      set({ stats: data, isLoading: false });
    } catch (e: any) {
      set({ error: e.message || 'Ошибка загрузки статистики', isLoading: false });
    }
  },

  loadPromos: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await apiGet<PromoCode[]>('/admin/promo');
      set({ promos: data, isLoading: false });
    } catch (e: any) {
      set({ error: e.message || 'Ошибка загрузки кодов', isLoading: false });
    }
  },

  generatePromos: async (type, count) => {
    try {
      set({ isLoading: true, error: null });
      await apiPost('/admin/promo/generate', { type, count });
      await get().loadPromos(); // Reload list after generation
      set({ isLoading: false });
    } catch (e: any) {
      set({ error: e.message || 'Ошибка генерации', isLoading: false });
      throw e;
    }
  }
}));
