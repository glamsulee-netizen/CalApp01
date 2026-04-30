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
// 6. Смена пароля администратора через ChangePasswordModal

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdminStore } from '../store/adminStore';
import { useAuthStore } from '../store/authStore';
import ChangePasswordModal from '../components/UI/ChangePasswordModal';

type AdminTab = 'stats' | 'users' | 'promo' | 'settings' | 'smtp';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const { stats, promos, isLoading, loadStats, loadPromos, generatePromos } = useAdminStore();

  const [promoType, setPromoType] = useState<'SUBSCRIPTION_MONTH' | 'SUBSCRIPTION_YEAR'>('SUBSCRIPTION_MONTH');
  const [promoCount, setPromoCount] = useState<number>(5);

  useEffect(() => {
    if (activeTab === 'stats') loadStats();
    if (activeTab === 'promo') loadPromos();
  }, [activeTab]);

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
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/" style={{
            marginRight: 16,
            fontSize: 24,
            textDecoration: 'none',
            width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--card-bg)', borderRadius: '50%'
          }}>
            ⬅️
          </Link>
          <h1 style={{ fontSize: 'var(--font-size-title1)', fontWeight: 700, margin: 0 }}>
            Админ-панель
          </h1>
        </div>
        
        <button
          onClick={() => setShowChangePassword(true)}
          style={{
            background: 'var(--ios-blue)',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 20,
            fontSize: 'var(--font-size-subheadline)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          🔐 Сменить пароль
        </button>
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
            {isLoading && !stats ? (
              <p style={{ color: 'var(--text-secondary)' }}>Загрузка...</p>
            ) : stats ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                <div style={{ background: 'var(--system-gray6)', padding: 16, borderRadius: 12 }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ios-blue)' }}>{stats.totalUsers}</div>
                  <div style={{ fontSize: 'var(--font-size-caption1)', color: 'var(--text-secondary)' }}>Пользователей</div>
                </div>
                <div style={{ background: 'var(--system-gray6)', padding: 16, borderRadius: 12 }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ios-indigo)' }}>{stats.totalSpecialists}</div>
                  <div style={{ fontSize: 'var(--font-size-caption1)', color: 'var(--text-secondary)' }}>Специалистов</div>
                </div>
                <div style={{ background: 'var(--system-gray6)', padding: 16, borderRadius: 12 }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ios-purple)' }}>{stats.activeCalendars}</div>
                  <div style={{ fontSize: 'var(--font-size-caption1)', color: 'var(--text-secondary)' }}>Календарей</div>
                </div>
                <div style={{ background: 'var(--system-gray6)', padding: 16, borderRadius: 12 }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ios-green)' }}>{stats.todayBookings}</div>
                  <div style={{ fontSize: 'var(--font-size-caption1)', color: 'var(--text-secondary)' }}>Броней за сегодня</div>
                </div>
              </div>
            ) : null}
          </div>
        )}
        
        {activeTab === 'users' && (
          <div className="card">
            <h3 style={{ margin: '0 0 16px', fontSize: 'var(--font-size-headline)' }}>Управление пользователями</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-subheadline)' }}>
              (В разработке) Список пользователей с возможностью выдачи ролей.
            </p>
          </div>
        )}
        
        {activeTab === 'promo' && (
          <div className="card">
            <h3 style={{ margin: '0 0 16px', fontSize: 'var(--font-size-headline)' }}>Генерация промокодов</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-subheadline)', marginBottom: 20 }}>
               Создание кодов-билетов для подписки специалиста. При активации этих кодов пользователь получит возможность создавать свой календарь.
            </p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <select 
                className="form-control" 
                style={{ flex: 2, minWidth: 200 }}
                value={promoType} 
                onChange={e => setPromoType(e.target.value as any)}
              >
                <option value="SUBSCRIPTION_MONTH">Подписка 30 дней</option>
                <option value="SUBSCRIPTION_YEAR">Подписка 365 дней</option>
              </select>
              <input 
                type="number" 
                className="form-control" 
                style={{ flex: 1, minWidth: 100 }}
                value={promoCount} 
                onChange={e => setPromoCount(Number(e.target.value))} 
                min={1} max={100} 
              />
              <button 
                className="btn btn-primary" 
                onClick={() => generatePromos(promoType, promoCount)}
                disabled={isLoading}
              >
                {isLoading ? 'Генерация...' : 'Сгенерировать'}
              </button>
            </div>

            <h4 style={{ margin: '24px 0 12px' }}>Сгенерированные промокоды</h4>
            <div style={{ overflowX: 'auto', margin: '0 -16px', padding: '0 16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-subheadline)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 0', minWidth: 120 }}>Код</th>
                    <th style={{ padding: '8px 0', minWidth: 100 }}>Тип</th>
                    <th style={{ padding: '8px 0', minWidth: 80 }}>Статус</th>
                    <th style={{ padding: '8px 0', textAlign: 'right' }}>Копировать</th>
                  </tr>
                </thead>
                <tbody>
                  {promos.length === 0 && (
                    <tr><td colSpan={4} style={{ padding: 16, textAlign: 'center', color: 'var(--text-secondary)' }}>Кодов пока нет</td></tr>
                  )}
                  {promos.map(promo => (
                    <tr key={promo.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 0', fontFamily: 'monospace', fontSize: 16, fontWeight: 700 }}>
                        {promo.code}
                      </td>
                      <td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>
                        {promo.type === 'SUBSCRIPTION_MONTH' ? '30 Дней' : 'Год'}
                      </td>
                      <td style={{ padding: '12px 0' }}>
                        {promo.isUsed ? (
                          <span style={{ color: 'var(--ios-red)', fontSize: 13, fontWeight: 600, background: 'rgba(255,59,48,0.1)', padding: '4px 8px', borderRadius: 6 }}>ИСПОЛЬЗОВАН</span>
                        ) : (
                          <span style={{ color: 'var(--ios-green)', fontSize: 13, fontWeight: 600, background: 'rgba(52,199,89,0.1)', padding: '4px 8px', borderRadius: 6 }}>ДОСТУПЕН</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 0', textAlign: 'right' }}>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(promo.code);
                            alert('Скопировано: ' + promo.code);
                          }}
                          style={{
                            background: 'transparent', border: '1px solid var(--ios-blue)', color: 'var(--ios-blue)',
                            padding: '4px 12px', borderRadius: 16, fontSize: 13, cursor: 'pointer'
                          }}
                        >
                          Копировать
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSuccess={() => {
          setShowChangePassword(false);
          alert('Пароль успешно изменен!');
        }}
      />
    </div>
  );
}
