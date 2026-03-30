// ============================================
// CalApp01 — WeekGrid (Недельная сетка)
// ============================================
// AGENT_INSTRUCTION:
// Основной компонент календаря. Сетка: столбцы = дни недели, строки = часы.
// Props:
//   slots: SlotData[]         — слоты за текущую неделю
//   weekStart: Date           — начало недели (понедельник)
//   startHour: number         — начало дня (например 8)
//   endHour: number           — конец дня (например 22)
//   slotDuration: number      — длительность слота в минутах
//   workDays: number[]        — рабочие дни (1=Пн..7=Вс)
//   isSpecialist: boolean     — режим специалиста
//   selectedSlotId: number|null
//   colorScheme: object       — кастомные цвета от специалиста
//   onSlotClick: (slot) => void
//   onSlotResize?: (slotId, newEndTime) => void  — touch-resize (specialist)
//
// Рендеринг:
// 1. Построить двумерный массив [часы][дни]
// 2. Для каждой ячейки — найти слот по date+startTime
// 3. Применить CSS-класс: --open, --closed, --booked, --selected, --my-booking
// 4. Touch-resize: pointer events на нижнем крае слота (specialist mode)
//
// ВАЖНО для mobile-first:
// - На маленьких экранах показывать 3 дня + скролл
// - Минимальный размер ячейки 44px (Apple touch target)

import React from 'react';
import SlotCell from './SlotCell';

interface SlotData {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  isOpen: boolean;
  isBooked: boolean;
  booking?: { id: number; userName: string; isPaid: boolean; userId: number };
  isMyBooking?: boolean;
}

interface WeekGridProps {
  slots: SlotData[];
  weekStart: Date;
  startHour: number;
  endHour: number;
  slotDuration: number;
  workDays: number[];
  isSpecialist?: boolean;
  selectedSlotId?: number | null;
  colorScheme?: Record<string, string>;
  onSlotClick?: (slot: SlotData) => void;
  onSlotResize?: (slotId: number, newEndTime: string) => void;
}

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function WeekGrid({
  slots, weekStart, startHour, endHour, slotDuration,
  workDays, isSpecialist, selectedSlotId, colorScheme, onSlotClick
}: WeekGridProps) {

  const hours: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    hours.push(`${h.toString().padStart(2, '0')}:00`);
    if (slotDuration === 30) {
      hours.push(`${h.toString().padStart(2, '0')}:30`);
    } else if (slotDuration === 15) {
      hours.push(`${h.toString().padStart(2, '0')}:15`);
      hours.push(`${h.toString().padStart(2, '0')}:30`);
      hours.push(`${h.toString().padStart(2, '0')}:45`);
    }
  }

  const days = workDays.map((dayNum) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dayNum - 1);
    return d;
  });

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 16, margin: '0 -16px' }}>
      <div style={{ minWidth: 320, padding: '0 16px' }}>
        {/* Header: Дни недели */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: `50px repeat(${days.length}, 1fr)`,
          gap: 8,
          marginBottom: 12
        }}>
          <div /> {/* Empty top-left cell */}
          {days.map((day, i) => {
            const isToday = new Date().toDateString() === day.toDateString();
            return (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: 'var(--font-size-caption1)', 
                  fontWeight: 600, 
                  color: isToday ? 'var(--ios-blue)' : 'var(--text-secondary)',
                  textTransform: 'uppercase'
                }}>
                  {DAY_NAMES[workDays[i] - 1]}
                </div>
                <div style={{ 
                  fontSize: 'var(--font-size-title3)', 
                  fontWeight: isToday ? 700 : 400,
                  color: isToday ? 'var(--ios-blue)' : 'var(--text-primary)',
                  marginTop: 2
                }}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid: Часы × Дни */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: `50px repeat(${days.length}, 1fr)`,
          gap: 8 
        }}>
          {hours.map((hour) => (
            <React.Fragment key={hour}>
              <div style={{ 
                color: 'var(--text-secondary)', 
                fontSize: 'var(--font-size-caption1)',
                textAlign: 'right',
                paddingRight: 8,
                marginTop: -8 // Align with top of row
              }}>
                {hour.endsWith(':00') ? hour : ''}
              </div>

              {days.map((day, di) => {
                const dateStr = day.toISOString().split('T')[0];
                const slot = slots.find(s => s.date.startsWith(dateStr) && s.startTime === hour);
                
                return (
                  <SlotCell
                    key={`${hour}-${di}`}
                    id={slot?.id || 0}
                    time={hour}
                    isOpen={!!slot?.isOpen}
                    isBooked={!!slot?.isBooked}
                    isSelected={slot?.id === selectedSlotId}
                    isSpecialist={!!isSpecialist}
                    bookingUserName={slot?.booking?.userName}
                    isPaid={slot?.booking?.isPaid}
                    isMyBooking={slot?.isMyBooking}
                    colorScheme={colorScheme}
                    onClick={() => slot && onSlotClick?.(slot)}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
