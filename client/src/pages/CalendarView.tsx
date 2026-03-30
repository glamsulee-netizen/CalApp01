// ============================================
// CalApp01 — Публичный просмотр календаря
// ============================================
// AGENT_INSTRUCTION:
// Маршрут: /calendar/:shareLink
// Доступен без авторизации (optionalAuth на сервере).
// Показывает:
// 1. Название календаря + имя специалиста
// 2. WeekGrid с слотами (без возможности бронирования для анонимов)
// 3. Для неавторизованных: плашка «Войти для бронирования» сверху
// 4. Для авторизованных: WeekGrid с BookingBar
// При авторизации через эту страницу — returnUrl = текущий URL

import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCalendarStore } from '../store/calendarStore';
import WeekGrid from '../components/Calendar/WeekGrid';
import WeekNavigator from '../components/Calendar/WeekNavigator';
import BookingBar from '../components/Calendar/BookingBar';

export default function CalendarView() {
  const { shareLink } = useParams<{ shareLink: string }>();
  const { isAuthenticated } = useAuthStore();
  const { currentCalendar, loadCalendarByShare, isLoading, slots, weekStart, selectedSlotId, selectSlot } = useCalendarStore();

  useEffect(() => {
    if (shareLink) {
      loadCalendarByShare(shareLink);
    }
  }, [shareLink]);

  // Handle slot click
  const handleSlotClick = (slot: any) => {
    if (!isAuthenticated || !currentCalendar) return;
    if (slot.isOpen && !slot.isBooked) {
      selectSlot(slot.id === selectedSlotId ? null : slot.id);
    }
  };

  if (isLoading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Загрузка календаря...</div>
      </div>
    );
  }

  if (!currentCalendar) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: 'var(--spacing-2xl)', padding: '0 var(--ios-inset)' }}>
        <h2 style={{ marginBottom: 8 }}>Календарь не найден</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Ссылка недействительна или подписка специалиста истекла
        </p>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingBottom: selectedSlotId ? 100 : 40 }}>
      {/* Sticky Top Bar using Glassmorphism */}
      <div style={{ 
        position: 'sticky', top: 0, zIndex: 10, 
        background: 'rgba(0, 0, 0, 0.65)', 
        backdropFilter: 'blur(20px)', 
        WebkitBackdropFilter: 'blur(20px)',
        padding: 'max(env(safe-area-inset-top), 16px) var(--ios-inset) 12px',
        borderBottom: '0.5px solid var(--border-color)',
        marginBottom: 16
      }}>
        <h1 style={{ fontSize: 'var(--font-size-title1)', fontWeight: 700, margin: 0 }}>
          {currentCalendar.title}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-subheadline)', margin: 0 }}>
          {currentCalendar.ownerName}
        </p>
      </div>

      <div style={{ padding: '0 var(--ios-inset)' }}>
        {/* Banner for Unauthenticated Users */}
        {!isAuthenticated && (
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: 'var(--radius-card)',
            padding: '16px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <p style={{ marginBottom: 12, color: 'var(--text-primary)', fontSize: 'var(--font-size-callout)' }}>
              Для бронирования необходимо войти
            </p>
            <Link to={`/login?return=/calendar/${shareLink}`} className="btn btn-primary btn-sm" style={{ display: 'inline-block' }}>
              Войти или зарегистрироваться
            </Link>
          </div>
        )}

        <WeekNavigator />

        <div style={{ marginTop: 24 }}>
          <WeekGrid
            slots={slots}
            weekStart={weekStart}
            startHour={currentCalendar.startHour}
            endHour={currentCalendar.endHour}
            slotDuration={currentCalendar.slotDuration}
            workDays={currentCalendar.workDays}
            selectedSlotId={selectedSlotId}
            onSlotClick={handleSlotClick}
            colorScheme={currentCalendar.colorScheme as Record<string, string>}
          />
        </div>
      </div>

      {isAuthenticated && selectedSlotId && (
        <BookingBar />
      )}
    </div>
  );
}
