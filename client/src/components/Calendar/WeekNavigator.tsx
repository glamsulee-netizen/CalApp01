// ============================================
// CalApp01 — WeekNavigator
// ============================================
// AGENT_INSTRUCTION:
// Кнопки «←» и «→» для перехода между неделями.
// Текст: "12 – 18 марта 2026"
// Кнопка «назад» деактивирована если текущая неделя.
// Кнопка «вперёд» деактивирована если на след. неделях нет открытых слотов.

import React from 'react';
import { useCalendarStore } from '../../store/calendarStore';

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

export default function WeekNavigator() {
  const { weekStart, nextWeek, prevWeek } = useCalendarStore();

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

  return (
    <div className="week-nav">
      <button className="week-nav-btn" onClick={prevWeek} disabled={isCurrentWeek} aria-label="Предыдущая неделя">
        ←
      </button>
      <span className="week-nav-title">{formatWeek()}</span>
      <button className="week-nav-btn" onClick={nextWeek} aria-label="Следующая неделя">
        →
      </button>
    </div>
  );
}
