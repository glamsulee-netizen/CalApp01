// ============================================
// CalApp01 — Страница входа (iOS Design)
// ============================================
// AGENT_INSTRUCTION:
// iOS-style логин. Дизайн как в нативном iOS-приложении:
// - Grouped inset карточки (ios-input-group)
// - Системный шрифт (SF Pro)
// - Кнопка — полноширинная, скруглённая
// - Анимация scale при тапе
// - Минималистичный чистый стиль

import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[LoginPage] Starting login for:', email);
    
    let user;
    try {
      user = await login(email, password);
      console.log('[LoginPage] Login successful, user:', user);
    } catch (error) {
      console.error('[LoginPage] Login failed:', error);
      // Ошибка уже обработана в authStore и показана пользователю
      return; // Не продолжаем перенаправление при ошибке
    }
    
    if (!user) {
      console.log('[LoginPage] No user returned after login');
      return;
    }
    
    // Админ редиректится в админ-панель
    let returnUrl = searchParams.get('return') || '/';
    
    if (user.role === 'ADMIN') {
      console.log('[LoginPage] User is ADMIN, redirecting to /admin');
      returnUrl = '/admin';
    } else {
      console.log('[LoginPage] User role:', user.role, 'redirecting to:', returnUrl);
    }
    
    navigate(returnUrl);
  };

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '0 var(--ios-inset)' }}>
      {/* Logo / Title area */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          width: 80, height: 80, borderRadius: 20,
          background: 'var(--accent)', margin: '0 auto 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '36px', fontWeight: 700, color: '#fff',
          boxShadow: '0 8px 24px rgba(10, 132, 255, 0.3)',
        }}>
          C
        </div>
        <h2 style={{ marginBottom: 4 }}>Добро пожаловать</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-subheadline)' }}>
          Войдите для бронирования записи
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          background: 'rgba(255, 69, 58, 0.12)',
          color: 'var(--ios-red)',
          borderRadius: 'var(--radius-card)',
          padding: '12px 16px',
          marginBottom: 16,
          width: '100%',
          maxWidth: 400,
          fontSize: 'var(--font-size-subheadline)',
          textAlign: 'center',
        }}>
          {error}
        </div>
      )}

      {/* iOS Grouped Inset Input */}
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 400 }}>
        <div className="ios-input-group" style={{ marginBottom: 16 }}>
          <div className="ios-input-row">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              required
              autoComplete="email"
              inputMode="email"
            />
          </div>
          <div className="ios-input-row">
            <label>Пароль</label>
            <input
              type="password"
              placeholder="Обязательно"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              required
              autoComplete="current-password"
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={isLoading} style={{ borderRadius: 'var(--radius-card)' }}>
          {isLoading ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-secondary)', fontSize: 'var(--font-size-subheadline)' }}>
        Нет аккаунта?{' '}
        <Link to="/register">Создать аккаунт</Link>
      </p>
    </div>
  );
}
