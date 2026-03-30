// ============================================
// CalApp01 — BookingMenu (Меню действий бронирования)
// ============================================
// AGENT_INSTRUCTION:
// BottomSheet с действиями для специалиста при тапе на забронированный слот.
// Содержит:
// 1. Инфо: имя клиента, телефон, мессенджер
// 2. Кнопка «Написать» → открыть мессенджер (по выбранному типу)
// 3. Кнопка «Позвонить» → tel: ссылка
// 4. Кнопка «Оплачено/Не оплачено» → toggle isPaid
// 5. Кнопка «Отменить запись» → cancelBooking + подтверждение

import React, { useState } from 'react';

interface BookingMenuProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: number;
    userName: string;
    userPhone: string;
    userMessenger: string;
    userMessengerType: string;
    isPaid: boolean;
    date: string;
    startTime: string;
    endTime: string;
  };
  onTogglePaid: (bookingId: number) => void;
  onCancel: (bookingId: number) => void;
}

export default function BookingMenu({ isOpen, onClose, booking, onTogglePaid, onCancel }: BookingMenuProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  const getMessengerLink = () => {
    const { userMessenger, userMessengerType } = booking;
    switch (userMessengerType) {
      case 'telegram': return `https://t.me/${userMessenger.replace('@', '')}`;
      case 'whatsapp': return `https://wa.me/${userMessenger.replace(/\D/g, '')}`;
      case 'viber': return `viber://chat?number=${userMessenger.replace(/\D/g, '')}`;
      default: return '#';
    }
  };

  return (
    <>
      <div className="bottom-sheet-overlay" onClick={onClose} />
      <div className="bottom-sheet">
        <div className="bottom-sheet-handle" />
        <div className="specialist-menu">
          {/* 1. Инфо */}
          <div className="specialist-menu__info">
            <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>{booking.userName}</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              {booking.date}, {booking.startTime} – {booking.endTime}
            </p>
            {booking.userPhone && <p style={{ fontSize: 'var(--font-size-sm)' }}>📞 {booking.userPhone}</p>}
            {booking.userMessenger && <p style={{ fontSize: 'var(--font-size-sm)' }}>💬 {booking.userMessenger} ({booking.userMessengerType})</p>}
          </div>

          {/* 2-3. Контакты */}
          <div className="specialist-menu__actions">
            {booking.userMessenger && (
              <a href={getMessengerLink()} target="_blank" rel="noopener" className="btn btn-secondary btn-block" style={{ textDecoration: 'none' }}>
                💬 Написать в {booking.userMessengerType}
              </a>
            )}
            {booking.userPhone && (
              <a href={`tel:${booking.userPhone}`} className="btn btn-secondary btn-block" style={{ textDecoration: 'none' }}>
                📞 Позвонить
              </a>
            )}

            {/* 4. Toggle оплаты */}
            <button
              className={`btn btn-block ${booking.isPaid ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => onTogglePaid(booking.id)}
              style={booking.isPaid ? { borderColor: 'var(--color-success)', color: 'var(--color-success)' } : {}}
            >
              {booking.isPaid ? '✓ Оплачено' : 'Отметить оплату'}
            </button>

            {/* 5. Отмена */}
            {!showConfirm ? (
              <button className="btn btn-danger btn-block" onClick={() => setShowConfirm(true)}>
                Отменить запись
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => { onCancel(booking.id); onClose(); }}>
                  Да, отменить
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowConfirm(false)}>
                  Нет
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
