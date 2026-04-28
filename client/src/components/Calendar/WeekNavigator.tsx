// ============================================
// CalApp01 — WeekNavigator
// ============================================
// AGENT_INSTRUCTION:
// Кнопки «←» и «→» для перехода между неделями.
// Текст: "12 – 18 марта 2026"
// Кнопка «назад» деактивирована если текущая неделя.
// Кнопка «вперёд» деактивирована если на след. неделях нет открытых слотов.
// Поддержка свайпа влево/вправо для листания недель (мобильная навигация).

import React, { useRef, useState } from 'react';
import { useCalendarStore } from '../../store/calendarStore';

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

export default function WeekNavigator() {
  const { weekStart, nextWeek, prevWeek } = useCalendarStore();
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const isCurrentWeek = (() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return weekStart <= now && weekEnd >= now;
  })();

  const formatWeek = () => {
    const start = weekStart.getDate();
    const end = weekEnd.getDate();
    const month = MONTHS[weekEnd.getMonth()];
    const year = weekEnd.getFullYear();
    return `${start} – ${end} ${month} ${year}`;
  };

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) {
      setIsSwiping(false);
      return;
    }

    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        // Swipe left → next week
        nextWeek();
      } else {
        // Swipe right → previous week (if not current week)
        if (!isCurrentWeek) {
          prevWeek();
        }
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
    setIsSwiping(false);
  };

  return (
    <div 
      className="week-nav"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y', userSelect: 'none' }}
    >
      <button 
        className="week-nav-btn" 
        onClick={prevWeek} 
        disabled={isCurrentWeek} 
        aria-label="Предыдущая неделя"
        style={{ opacity: isCurrentWeek ? 0.3 : 1 }}
      >
        ←
      </button>
      <span className="week-nav-title" style={{ 
        transition: isSwiping ? 'transform 0.2s ease' : 'none',
        transform: isSwiping && touchEndX.current && touchStartX.current 
          ? `translateX(${(touchEndX.current - touchStartX.current) * 0.1}px)` 
          : 'translateX(0)'
      }}>
        {formatWeek()}
      </span>
      <button 
        className="week-nav-btn" 
        onClick={nextWeek} 
        aria-label="Следующая неделя"
      >
        →
      </button>
    </div>
  );
}
