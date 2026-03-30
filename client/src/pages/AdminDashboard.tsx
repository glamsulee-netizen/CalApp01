// ============================================
// CalApp01 — Админ-панель
// ============================================
// AGENT_INSTRUCTION:
// Маршрут /admin (только PlatformRole.ADMIN).
// Табы: Статистика | Пользователи | Промокоды | Настройки | SMTP
// 1. Статистика: карточки с числами (Stats component)
// 2. Пользователи: таблица с поиском, ролями (UserList)
// 3. Промокоды: генератор + список (PromoGenerator)
// 4. Настройки: шаблон календаря, регистрация open/close
// 5. SMTP: управление провайдерами (добавить/редактировать/удалить)

import React, { useState } from 'react';

type AdminTab = 'stats' | 'users' | 'promo' | 'settings' | 'smtp';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');

  const tabs: { key: AdminTab; label: string, icon: string }[] = [
    { key: 'stats', label: 'Обзор', icon: '📊' },
    { key: 'users', label: 'Пользователи', icon: '👥' },
    { key: 'promo', label: 'Промо', icon: '🎟️' },
    { key: 'settings', label: 'Настройки', icon: '⚙️' },
    { key: 'smtp', label: 'Почта', icon: '📧' },
  ];

  return (
    <div className="page" style={{ paddingBottom: 60, background: 'var(--bg-secondary)' }}>
      {/* iOS Styled Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        padding: 'max(env(safe-area-inset-top), 20px) var(--ios-inset) 12px',
        background: 'rgba(28, 28, 30, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid var(--border-color)',
      }}>
        <h1 style={{ fontSize: 'var(--font-size-title1)', fontWeight: 700, margin: 0 }}>
          Админ-панель
        </h1>
      </div>

      {/* Tabs */}
      <div style={{
        padding: '16px var(--ios-inset)',
        background: 'var(--bg-primary)',
        borderBottom: '0.5px solid var(--border-color)',
        marginBottom: 16
      }}>
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, 
          WebkitOverflowScrolling: 'touch', margin: '0 -16px', paddingLeft: 16, paddingRight: 16
        }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  background: isActive ? 'var(--text-primary)' : 'var(--card-bg)',
                  color: isActive ? 'var(--bg-primary)' : 'var(--text-primary)',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: 'var(--font-size-subheadline)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Placholders */}
      <div style={{ padding: '0 var(--ios-inset)' }}>
        {activeTab === 'stats' && (
          <div className="card">
            <h3 style={{ margin: '0 0 16px', fontSize: 'var(--font-size-headline)' }}>Статистика платформы</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-subheadline)' }}>
              Здесь будут выводиться основные метрики (кол-во пользователей, активных календарей и т.д.)
            </p>
          </div>
        )}
        
        {activeTab === 'users' && (
          <div className="card">
            <h3 style={{ margin: '0 0 16px', fontSize: 'var(--font-size-headline)' }}>Управление пользователями</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-subheadline)' }}>
              Список пользователей с возможностью сброса пароля и выдачи ролей.
            </p>
          </div>
        )}
        
        {activeTab === 'promo' && (
          <div className="card">
             <h3 style={{ margin: '0 0 16px', fontSize: 'var(--font-size-headline)' }}>Генерация промокодов</h3>
             <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-subheadline)' }}>
               Создание кодов для активации подписки специалиста.
             </p>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="card">
            <h3 style={{ margin: '0 0 16px', fontSize: 'var(--font-size-headline)' }}>Настройки платформы</h3>
            <div className="ios-input-group">
              <div className="ios-input-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--font-size-body)' }}>Открытая регистрация</span>
                <div className="ios-toggle active"></div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'smtp' && (
          <div className="card">
            <h3 style={{ margin: '0 0 16px', fontSize: 'var(--font-size-headline)' }}>Управление SMTP</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-subheadline)' }}>
              Добавление и настройка резервных провайдеров электронной почты для failover.
            </p>
            <button className="btn btn-primary" style={{ marginTop: 16 }}>+ Добавить провайдера</button>
          </div>
        )}
      </div>
    </div>
  );
}
