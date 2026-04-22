// ============================================
// CalApp01 — Настройки профиля (iOS Design)
// ============================================
// AGENT_INSTRUCTION:
// Дизайн как Settings.app на iPhone:
// - Секционные заголовки (section-header)
// - Grouped inset карточки (card-inset + card-row)
// - iOS Toggle switches
// - Destructive кнопка выхода
// - Chevron на навигационных элементах

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { apiPatch } from '../api';
import { useToastStore } from '../components/UI/Toast';

export default function Settings() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [messenger, setMessenger] = useState('');
  const [messengerType, setMessengerType] = useState('telegram');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const showToast = useToastStore((s) => s.show);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await apiPatch('/users/me', {
        name,
        phone,
        messenger,
        messengerType,
      });
      showToast('Профиль сохранен', 'success');
    } catch (error: any) {
      showToast(error.message || 'Не удалось сохранить профиль', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="page">
      {/* iOS Large Title */}
      <div className="ios-nav-bar__large-title">Настройки</div>

      {/* Section: Профиль */}
      <div className="section-header">Профиль</div>
      <div className="card-inset" style={{ margin: '0 var(--ios-inset)' }}>
        <div className="ios-input-row">
          <label>Имя</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Введите имя" />
        </div>
        <div className="ios-input-row">
          <label>Email</label>
          <input value={user?.email || ''} disabled style={{ color: 'var(--text-tertiary)' }} />
        </div>
        <div className="ios-input-row">
          <label>Телефон</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 999 123-45-67" type="tel" />
        </div>
      </div>
      <div className="section-footer">Имя и телефон видны специалисту при бронировании.</div>

      {/* Section: Мессенджер */}
      <div className="section-header">Мессенджер</div>
      <div className="card-inset" style={{ margin: '0 var(--ios-inset)' }}>
        <div className="card-row" style={{ cursor: 'default' }}>
          <span className="card-row__label">Тип</span>
          <select
            value={messengerType}
            onChange={(e) => setMessengerType(e.target.value)}
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--text-secondary)', fontSize: 'var(--font-size-body)',
              fontFamily: 'var(--font-family)', textAlign: 'right', outline: 'none',
            }}
          >
            <option value="telegram">Telegram</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="viber">Viber</option>
            <option value="other">Другой</option>
          </select>
        </div>
        <div className="ios-input-row">
          <label>Логин</label>
          <input value={messenger} onChange={(e) => setMessenger(e.target.value)} placeholder="@username" />
        </div>
      </div>

      {/* Section: Уведомления */}
      <div className="section-header">Уведомления</div>
      <div className="card-inset" style={{ margin: '0 var(--ios-inset)' }}>
        <div className="card-row" style={{ cursor: 'default' }}>
          <span className="card-row__label">Push-уведомления</span>
          <button
            className={`ios-toggle ${pushEnabled ? 'active' : ''}`}
            onClick={() => setPushEnabled(!pushEnabled)}
          />
        </div>
      </div>
      <div className="section-footer">Получайте уведомления о бронированиях и напоминания за час до записи.</div>

      {/* Кнопка Сохранить */}
      <div style={{ margin: 'var(--spacing-lg) var(--ios-inset)' }}>
        <button className="btn btn-primary btn-block" onClick={handleSave} style={{ borderRadius: 'var(--radius-card)' }} disabled={isSaving}>
          {isSaving ? 'Сохраняем...' : 'Сохранить'}
        </button>
      </div>

      {/* Section: Аккаунт */}
      <div className="section-header">Аккаунт</div>
      <div className="card-inset" style={{ margin: '0 var(--ios-inset)' }}>
        <div className="card-row">
          <span className="card-row__label">Сменить пароль</span>
          <span className="card-row__chevron" />
        </div>
      </div>

      {/* Destructive: Выход */}
      <div style={{ margin: 'var(--spacing-xl) var(--ios-inset)' }}>
        <div className="card-inset">
          <div className="card-row" onClick={handleLogout} style={{ justifyContent: 'center' }}>
            <span style={{ color: 'var(--ios-red)', fontWeight: 400 }}>Выйти из аккаунта</span>
          </div>
        </div>
      </div>
    </div>
  );
}
