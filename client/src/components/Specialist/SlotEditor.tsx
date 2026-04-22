// ============================================
// CalApp01 — SlotEditor (Touch-resize слотов)
// ============================================
// AGENT_INSTRUCTION:
// Компонент для создания и редактирования слотов специалистом.
// Touch-resize: зажать нижний край слота → потянуть вниз → увеличить endTime.
// Шаг: 15 минут. Минимум: slotDuration. Максимум: 240 минут (4 часа).
//
// Реализация touch-resize:
// 1. onTouchStart на элементе-хэндле внизу слота
// 2. onTouchMove → рассчитать deltaY → перевести в минуты (15 мин = высота ячейки)
// 3. onTouchEnd → отправить updateSlot (PATCH /api/calendar/:id/slots/:slotId)
// 4. Визуальный фидбек: показать новый endTime во время перетаскивания
//
// Также: при тапе на пустую область сетки → создать новый слот

import React, { useRef, useState } from 'react';

interface SlotEditorProps {
  calendarId: number;
  slotId: number;
  startTime: string;
  endTime: string;
  cellHeight: number; // Высота одной 15-мин ячейки в px
  onResize: (slotId: number, newEndTime: string) => void;
}

export default function SlotEditor({ slotId, startTime, endTime, cellHeight, onResize }: SlotEditorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewEndTime, setPreviewEndTime] = useState(endTime);
  const startY = useRef(0);
  const startEndTime = useRef(endTime);

  const toMinutes = (value: string): number => {
    const [h, m] = value.split(':').map(Number);
    return h * 60 + m;
  };

  const toTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  return (
    <div
      style={{
        position: 'relative',
        cursor: 'ns-resize',
      }}
    >
      {/* Resize handle */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '20%',
          right: '20%',
          height: 6,
          background: isDragging ? 'var(--color-accent)' : 'rgba(255,255,255,0.2)',
          borderRadius: 'var(--radius-full)',
          cursor: 'ns-resize',
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          startY.current = e.touches[0].clientY;
          startEndTime.current = previewEndTime;
        }}
        onTouchMove={(e) => {
          if (!isDragging) return;
          const deltaY = e.touches[0].clientY - startY.current;
          const minuteStep = Math.round(deltaY / cellHeight) * 15;
          const baseEnd = toMinutes(startEndTime.current);
          const start = toMinutes(startTime);
          const minEnd = start + 15;
          const maxEnd = start + 240;
          const nextEnd = Math.min(maxEnd, Math.max(minEnd, baseEnd + minuteStep));
          setPreviewEndTime(toTime(nextEnd));
        }}
        onTouchEnd={() => {
          setIsDragging(false);
          onResize(slotId, previewEndTime);
        }}
      />
      {isDragging && (
        <div style={{ position: 'absolute', bottom: -20, left: 0, right: 0, textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--color-accent)' }}>
          → {previewEndTime}
        </div>
      )}
    </div>
  );
}
