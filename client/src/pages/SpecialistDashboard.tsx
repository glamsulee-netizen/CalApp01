// ============================================
// CalApp01 — Дашборд специалиста
// ============================================
// AGENT_INSTRUCTION:
// Страница /specialist. Показывается когда у пользователя есть Calendar(owner).
// Содержит:
// 1. Счётчик подписки (сколько дней осталось)
// 2. Навигация: Календарь | Пользователи | Настройки | QR-код
// 3. Таб «Календарь»: SpecialistCalendar (с возможностью тогглить слоты)
// 4. Таб «Пользователи»: UserManager (роли, лимиты, контакты)
// 5. Таб «Настройки»: CalendarSettings (часы, дни, цвета)
// 6. Кнопка быстрого QR-кода
// 7. Уведомления об отменах/переносах (визуальный индикатор)
// 
// Если у пользователя нет Calendar → форма «Активировать календарь» (ввод кода)

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCalendarStore } from '../store/calendarStore';
import SpecialistCalendar from './SpecialistCalendar';

type Tab = 'calendar' | 'users' | 'settings';

export default function SpecialistDashboard() {
  const { user } = useAuthStore();
  const { currentCalendar, subscriptions, loadSubscriptions } = useCalendarStore();
  
  const [activeTab, setActiveTab] = useState<Tab>('calendar');
  const [activationCode, setActivationCode] = useState('');

  // Check if User owns any calendar
  // Strictly speaking we should get 'ownedCalendars' from the API, 
  // but for now let's assume if there's a currentCalendar and user owns it, or we handle it via load
  const [hasCalendar, setHasCalendar] = useState(true); // Stub until API hook is real

  useEffect(() => {
    // API logic to check if they have an active calendar goes here.
  }, []);

  if (!hasCalendar) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '0 var(--ios-inset)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20, background: 'var(--accent)',
            margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 40, color: '#fff', boxShadow: '0 8px 24px rgba(10, 132, 255, 0.3)'
          }}>
            🗓️
          </div>
          <h2 style={{ marginBottom: 8, fontSize: 'var(--font-size-title2)' }}>Активация календаря</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-subheadline)' }}>
            Введите код, полученный от администратора платформы
          </p>
        </div>

        <div style={{ width: '100%', maxWidth: 400 }}>
          <div className="ios-input-group" style={{ marginBottom: 24 }}>
            <div className="ios-input-row">
              <input
                type="text"
                placeholder="XXXX-XXXX"
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                maxLength={9}
                style={{ textAlign: 'center', letterSpacing: 4, fontSize: 'var(--font-size-title3)', fontWeight: 600, padding: '16px 0' }}
              />
            </div>
          </div>
          
          <button 
            className="btn btn-primary btn-block btn-lg" 
            disabled={activationCode.length < 8}
            style={{ borderRadius: 'var(--radius-card)' }}
          >
            Активировать
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingBottom: 60 }}>
      {/* iOS Styled Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        padding: 'max(env(safe-area-inset-top), 20px) var(--ios-inset) 12px',
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-title1)', fontWeight: 700, margin: 0 }}>
            Кабинет
          </h1>
          <p style={{ margin: 0, fontSize: 'var(--font-size-caption1)', color: 'var(--ios-green)', fontWeight: 600 }}>
            Подписка активна (30 дней)
          </p>
        </div>
        <button className="btn" style={{ margin: 0, padding: '6px 12px', borderRadius: 16, background: 'var(--card-bg)', color: 'var(--ios-blue)' }}>
          QR
        </button>
      </div>

      <div style={{ padding: '0 var(--ios-inset)', marginTop: 16 }}>
        {/* iOS Segmented Control */}
        <div style={{
          display: 'flex', background: 'var(--card-bg)', borderRadius: 8, padding: 2, marginBottom: 24
        }}>
          {(['calendar', 'users', 'settings'] as Tab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  background: isActive ? 'var(--system-gray5)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 0',
                  fontSize: 'var(--font-size-footnote)',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {{ calendar: 'Календарь', users: 'Клиенты', settings: 'Настройки' }[tab]}
              </button>
            );
          })}
        </div>

        {activeTab === 'calendar' && <SpecialistCalendar />}
        
        {activeTab === 'users' && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            Здесь будет управление клиентами
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            Здесь будут настройки календаря
          </div>
        )}
      </div>
    </div>
  );
}
