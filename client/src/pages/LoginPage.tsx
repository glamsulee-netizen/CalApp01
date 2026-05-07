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

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  console.error('[LoginPage] Component rendering');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    console.log('[LoginPage] Component mounted');
    console.log('[LoginPage] isLoading:', isLoading);
    console.log('[LoginPage] error:', error);
  }, [isLoading, error]);

  useEffect(() => {
    console.error('[LoginPage] useEffect running');
    if (buttonRef.current) {
      console.error('[LoginPage] Button ref current:', buttonRef.current);
      console.error('[LoginPage] Button disabled:', buttonRef.current.disabled);
      console.error('[LoginPage] Button style:', buttonRef.current.style);
      console.error('[LoginPage] Button pointerEvents:', buttonRef.current.style.pointerEvents);
      // Log computed styles
      const computed = window.getComputedStyle(buttonRef.current);
      console.error('[LoginPage] Button computed pointerEvents:', computed.pointerEvents);
      console.error('[LoginPage] Button computed opacity:', computed.opacity);
      console.error('[LoginPage] Button computed cursor:', computed.cursor);
      // Log position and dimensions
      const rect = buttonRef.current.getBoundingClientRect();
      console.error('[LoginPage] Button rect:', { top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    } else {
      console.error('[LoginPage] Button ref is null');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('[LoginPage] handleSubmit called, preventing default');
    e.preventDefault();
    console.log('[LoginPage] Starting login for:', email);
    console.log('[LoginPage] isLoading:', isLoading);
    console.log('[LoginPage] error:', error);
    
    let user;
    try {
      console.log('[LoginPage] Calling login function...');
      user = await login(email, password);
      console.log('[LoginPage] Login successful, user:', user);
    } catch (error) {
      console.error('[LoginPage] Login failed:', error);
      console.error('[LoginPage] Error details:', error);
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
    
    console.log('[LoginPage] Navigating to:', returnUrl);
    navigate(returnUrl);
  };

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '0 var(--ios-inset)' }}>
      {/* Test div to check if React event handlers work */}
      <div
        onClick={() => console.log('[LoginPage] Test div clicked!')}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          width: 50,
          height: 50,
          backgroundColor: 'red',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          borderRadius: '8px',
          zIndex: 1000
        }}
      >
        Test
      </div>

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

        <button
          type="submit"
          className="btn btn-primary btn-block btn-lg"
          style={{ borderRadius: 'var(--radius-card)' }}
          ref={buttonRef}
          onMouseDown={(e) => {
            console.error('[LoginPage] Button onMouseDown', e);
          }}
          onMouseUp={(e) => {
            console.error('[LoginPage] Button onMouseUp', e);
          }}
          onClick={(e) => {
            console.error('[LoginPage] Button onClick (direct) called');
            e.preventDefault();
            console.error('[LoginPage] Calling handleSubmit directly');
            handleSubmit(e);
          }}
        >
          Войти
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-secondary)', fontSize: 'var(--font-size-subheadline)' }}>
        Нет аккаунта?{' '}
        <Link to="/register">Создать аккаунт</Link>
      </p>
    </div>
  );
}
