// ============================================
// CalApp01 — BookingBar (Плашка «Записаться»)
// ============================================
// AGENT_INSTRUCTION:
// Фиксированная плашка снизу экрана. Появляется при выборе свободного слота.
// Показывает: дату, время + кнопка «Записаться».
// По клику: вызывает bookSlot и исчезает.
// Класс CSS: .booking-bar (уже описан в index.css)

import React from 'react';
import { useCalendarStore } from '../../store/calendarStore';

export default function BookingBar() {
  const { selectedSlotId, slots, bookSlot, cancelBooking, selectSlot } = useCalendarStore();

  if (!selectedSlotId) return null;

  const slot = slots.find(s => s.id === selectedSlotId);
  if (!slot) return null;

  // Don't show bar if it's booked by someone else
  if (slot.isBooked && !slot.isMyBooking) return null;

  const handleBook = async () => {
    await bookSlot(selectedSlotId);
    selectSlot(null);
  };

  const handleCancel = async () => {
    if (slot.booking?.id) {
      await cancelBooking(slot.booking.id);
      selectSlot(null);
    }
  };

  const isMyBooking = slot.isBooked && slot.isMyBooking;

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(var(--ios-inset) + env(safe-area-inset-bottom, 20px))',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - var(--ios-inset) * 2)',
      maxWidth: 400,
      background: 'rgba(28, 28, 30, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 'var(--radius-card)',
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      zIndex: 100,
      border: '0.5px solid rgba(255, 255, 255, 0.1)',
      animation: 'slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
    }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-callout)', color: '#fff' }}>
          {slot.startTime} – {slot.endTime}
        </div>
        <div style={{ fontSize: 'var(--font-size-subheadline)', color: 'var(--system-gray2)' }}>
          {new Date(slot.date).toLocaleDateString('ru-RU', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>
      {isMyBooking ? (
        <button 
          className="btn" 
          onClick={handleCancel}
          style={{ margin: 0, padding: '10px 20px', borderRadius: 20, background: 'rgba(255,69,58,0.15)', color: 'var(--ios-red)' }}
        >
          Отменить
        </button>
      ) : (
        <button 
          className="btn btn-primary" 
          onClick={handleBook}
          style={{ margin: 0, padding: '10px 20px', borderRadius: 20 }}
        >
          Записаться
        </button>
      )}
    </div>
  );
}
