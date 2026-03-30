// ============================================
// CalApp01 — Календарь специалиста (редактор)
// ============================================
// AGENT_INSTRUCTION:
// Полноэкранный редактор календаря специалиста.
// Сетка как у пользователя (WeekGrid), но все ячейки активные.
// Тап по пустой ячейке → toggle isOpen (открыть/закрыть для брони)
// Тап по забронированной ячейке → BookingMenu (infо, звонок, сообщение, оплата, отмена)
// Touch-resize: зажать край слота → потянуть вверх/вниз → изменить длительность
// Все изменения → Socket.IO → мгновенное обновление у пользователей.

import React, { useEffect } from 'react';
import { useCalendarStore } from '../store/calendarStore';
import WeekGrid from '../components/Calendar/WeekGrid';
import WeekNavigator from '../components/Calendar/WeekNavigator';

export default function SpecialistCalendar() {
  const { 
    currentCalendar, 
    slots, 
    weekStart, 
    selectedSlotId, 
    selectSlot 
  } = useCalendarStore();

  const handleSlotClick = (slot: any) => {
    // In specialist mode, tapping a slot could open an Action Sheet to toggle it,
    // or if it's booked, see details and cancel. 
    // Right now, just select it.
    selectSlot(slot.id === selectedSlotId ? null : slot.id);
  };

  if (!currentCalendar) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
        Календарь не загружен
      </div>
    );
  }

  return (
    <div>
      <WeekNavigator />
      <div style={{ marginTop: 24 }}>
        <WeekGrid
          slots={slots}
          weekStart={weekStart}
          startHour={currentCalendar.startHour}
          endHour={currentCalendar.endHour}
          slotDuration={currentCalendar.slotDuration}
          workDays={currentCalendar.workDays}
          isSpecialist={true}
          selectedSlotId={selectedSlotId}
          onSlotClick={handleSlotClick}
          colorScheme={currentCalendar.colorScheme as Record<string, string>}
        />
      </div>

      {/* TODO: Bottom Sheet for selectedSlotId to toggle availability / view booking details */}
      {selectedSlotId && (
        <div style={{
          position: 'fixed', bottom: 'calc(var(--ios-inset) + env(safe-area-inset-bottom, 20px))',
          left: '50%', transform: 'translateX(-50%)',
          width: 'calc(100% - var(--ios-inset) * 2)', maxWidth: 400,
          background: 'rgba(28, 28, 30, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 'var(--radius-card)', padding: '16px',
          display: 'flex', gap: 8, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)', zIndex: 100,
          border: '0.5px solid rgba(255, 255, 255, 0.1)', animation: 'slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}>
          <button className="btn btn-primary" style={{ flex: 1, margin: 0, padding: '10px' }}>
            Открыть / Закрыть
          </button>
          <button className="btn" style={{ margin: 0, padding: '10px', background: 'var(--system-gray5)', color: 'var(--text-primary)' }} onClick={() => selectSlot(null)}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
