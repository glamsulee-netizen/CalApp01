// ============================================
// CalApp01 — Auth Store (Zustand)
// ============================================
// AGENT_INSTRUCTION:
// Глобальное состояние аутентификации.
// При изменении isAuthenticated — подключаемся/отключаемся от Socket.IO.
// initialize() вызывается при загрузке App — пытается refresh token.

import { create } from 'zustand';
import { api, setAccessToken, clearAccessToken } from '../api';
import { getSocket, disconnectSocket } from '../api/socket';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  mustChangePassword: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initialize: async () => {
    // TODO: Реализовать
    // 1. Попробовать POST /api/auth/refresh
    // 2. Если успех — сохранить токен, получить /api/users/me
    // 3. Подключить Socket.IO
    // 4. Если неудача — set({ isLoading: false })
    set({ isLoading: false });
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const data = await api<{ accessToken: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setAccessToken(data.accessToken);
      getSocket(data.accessToken);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  register: async (email, password, name) => {
    try {
      set({ isLoading: true, error: null });
      const data = await api<{ accessToken: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });
      setAccessToken(data.accessToken);
      getSocket(data.accessToken);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch { /* ignore */ }
    clearAccessToken();
    disconnectSocket();
    set({ user: null, isAuthenticated: false, error: null });
  },

  changePassword: async (oldPassword, newPassword) => {
    try {
      set({ error: null });
      await api('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      set((state) => ({
        user: state.user ? { ...state.user, mustChangePassword: false } : null,
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  clearError: () => set({ error: null }),
}));
