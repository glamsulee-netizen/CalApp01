// ============================================
// CalApp01 — SlotCell (Ячейка слота)
// ============================================
// AGENT_INSTRUCTION:
// Отдельная ячейка в сетке календаря. Отвечает за:
// 1. Визуальное состояние (open/closed/booked/selected)
// 2. Touch-resize хэндл (полоска внизу ячейки для перетаскивания)
// 3. Анимации при изменении состояния
// 4. Индикатор оплаты (₽) для специалиста

import React from 'react';

export interface SlotCellProps {
  id: number;
  time: string;
  isOpen: boolean;
  isBooked: boolean;
  isSelected: boolean;
  isSpecialist: boolean;
  bookingUserName?: string;
  isPaid?: boolean;
  isMyBooking?: boolean;
  colorScheme?: Record<string, string>;
  onClick: () => void;
  onResizeStart?: () => void;
}

export default function SlotCell({
  time, isOpen, isBooked, isSelected, isSpecialist,
  bookingUserName, isPaid, isMyBooking, colorScheme, onClick
}: SlotCellProps) {
  
  let background = 'var(--card-bg)';
  let color = 'var(--text-secondary)';
  let border = '1px solid transparent';
  let opacity = 1;

  if (!isOpen && !isBooked) {
    opacity = 0.5;
  } else if (isBooked) {
    if (isSpecialist) {
      background = 'var(--system-gray6)';
      color = 'var(--text-primary)';
    } else if (isMyBooking) {
      background = 'var(--ios-blue)';
      color = '#fff';
    } else {
      background = 'var(--ios-red)';
      color = '#fff';
      opacity = 0.5; // unavailable for booking
    }
  } else if (isSelected) {
    background = colorScheme?.primary || 'var(--ios-blue)';
    color = '#fff';
  } else {
    background = colorScheme?.slotOpen || 'var(--system-gray5)';
    color = 'var(--text-primary)';
  }

  return (
    <div 
      onClick={onClick}
      style={{
        background,
        color,
        border,
        opacity,
        borderRadius: 8,
        height: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'var(--font-size-subheadline)',
        fontWeight: 600,
        transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
        cursor: isOpen && !isBooked ? 'pointer' : 'default',
        userSelect: 'none',
        position: 'relative',
        transform: isSelected ? 'scale(0.95)' : 'scale(1)',
      }}
    >
      {isBooked && isSpecialist ? (
        <span style={{ fontSize: '10px', textAlign: 'center', wordBreak: 'break-all', padding: '0 4px', lineHeight: 1.1 }}>
          {bookingUserName ? bookingUserName.slice(0, 10) : 'Занято'}{isPaid && ' ₽'}
        </span>
      ) : isBooked && isMyBooking ? (
        <span style={{ fontSize: '10px', textAlign: 'center' }}>Моя бронь</span>
      ) : (
        <span>{isOpen ? time : '-'}</span>
      )}
    </div>
  );
}
