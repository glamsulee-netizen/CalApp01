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
    try {
      set({ isLoading: true, error: null });
      const refresh = await api<{ accessToken: string }>('/auth/refresh', { method: 'POST' });
      setAccessToken(refresh.accessToken);
      const profile = await api<{ id: number; email: string; name: string; role: 'ADMIN' | 'USER'; mustChangePassword: boolean }>('/users/me');
      getSocket(refresh.accessToken);
      set({
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          mustChangePassword: profile.mustChangePassword,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      clearAccessToken();
      disconnectSocket();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      console.log('[AuthStore] Login started for:', email);
      set({ isLoading: true, error: null });
      const data = await api<{ accessToken: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      console.log('[AuthStore] Login successful, user role:', data.user.role, 'user data:', data.user);
      setAccessToken(data.accessToken);
      getSocket(data.accessToken);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      console.log('[AuthStore] State updated, user role in store:', data.user.role);
      return data.user; // Возвращаем данные пользователя
    } catch (error: any) {
      console.error('[AuthStore] Login error:', error.message);
      set({ error: error.message, isLoading: false });
      throw error; // Пробрасываем ошибку дальше
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
    } catch (error) {
      console.warn('[Auth] logout request failed', error);
    }
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
