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

  // TODO: Реализовать полный touch-resize
  // Используя onTouchStart, onTouchMove, onTouchEnd

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
