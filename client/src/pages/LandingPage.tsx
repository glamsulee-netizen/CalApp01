// ============================================
// CalApp01 — Лендинг (начальный экран)
// ============================================
// AGENT_INSTRUCTION:
// Для неавторизованных пользователей, зашедших без указания календаря.
// Простой лаконичный лендинг с описанием проекта.
// Кнопки "Регистрация/Вход".

import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="page" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100dvh', 
      padding: 'var(--spacing-xl) var(--ios-inset)',
      textAlign: 'center'
    }}>
      {/* Hero Section */}
      <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <div style={{
          width: 100, height: 100, borderRadius: 24,
          background: 'linear-gradient(135deg, var(--ios-blue), #5E5CE6)',
          margin: '0 auto var(--spacing-lg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '48px', fontWeight: 700, color: '#fff',
          boxShadow: '0 12px 32px rgba(10, 132, 255, 0.35)',
        }}>
          📅
        </div>
        
        <h1 style={{ 
          fontSize: 'var(--font-size-title1)', 
          fontWeight: 700, 
          marginBottom: 'var(--spacing-md)',
          lineHeight: 1.2
        }}>
          Запишитесь к специалисту
        </h1>
        
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: 'var(--font-size-body)',
          maxWidth: 280,
          margin: '0 auto',
          lineHeight: 1.5
        }}>
          Просто попросите ссылку у мастера — и записывайтесь на удобное время в несколько касаний
        </p>
      </div>

      {/* Features */}
      <div style={{ 
        display: 'grid', 
        gap: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-2xl)',
        textAlign: 'left',
        width: '100%',
        maxWidth: 300
      }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'flex-start' }}>
          <span style={{ fontSize: 24 }}>⚡</span>
          <div>
            <strong>Быстро</strong>
            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              Запись в 2 касания
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'flex-start' }}>
          <span style={{ fontSize: 24 }}>🔔</span>
          <div>
            <strong>Напоминания</strong>
            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              Не пропустите запись
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'flex-start' }}>
          <span style={{ fontSize: 24 }}>📱</span>
          <div>
            <strong>Удобно</strong>
            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              Работает как приложение
            </p>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 'var(--spacing-sm)', 
        width: '100%',
        maxWidth: 300
      }}>
        <Link 
          to="/register" 
          className="btn btn-primary btn-block btn-lg"
          style={{ borderRadius: 'var(--radius-card)' }}
        >
          Создать аккаунт
        </Link>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--spacing-sm)',
          margin: 'var(--spacing-xs) 0'
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
          <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-caption1)' }}>или</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
        </div>
        
        <Link 
          to="/login" 
          className="btn btn-secondary btn-block"
          style={{ borderRadius: 'var(--radius-card)' }}
        >
          Войти
        </Link>
      </div>

      {/* Footer */}
      <p style={{ 
        marginTop: 'var(--spacing-2xl)', 
        fontSize: 'var(--font-size-caption1)', 
        color: 'var(--text-tertiary)' 
      }}>
        Уже есть ссылка на календарь?{'\n'}
        <Link to="/calendar/demo" style={{ color: 'var(--ios-blue)' }}>
          Открыть демо
        </Link>
      </p>
    </div>
  );
}