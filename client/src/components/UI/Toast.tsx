// ============================================
// CalApp01 — Toast (Уведомления)
// ============================================
// AGENT_INSTRUCTION:
// Глобальная система toast-уведомлений. Используйте Zustand store:
// import { useToast } from '@/store/toastStore';
// useToast.getState().show('Успешно!', 'success');

import React, { useEffect } from 'react';
import { create } from 'zustand';

interface ToastItem {
  id: number; message: string; type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastState {
  toasts: ToastItem[];
  show: (message: string, type?: ToastItem['type']) => void;
  remove: (id: number) => void;
}

let nextId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (message, type = 'info') => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })), 3000);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));

export default function ToastContainer() {
  const { toasts, remove } = useToastStore();

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`} onClick={() => remove(t.id)}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
