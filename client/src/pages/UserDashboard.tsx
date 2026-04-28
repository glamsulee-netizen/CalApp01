// ============================================
// CalApp01 — Дашборд пользователя (главная)
// ============================================
// AGENT_INSTRUCTION:
// Показывает:
// 1. Плашка «ближайшая запись» (если есть)
// 2. Переключатель между подписанными календарями (CalendarSelector)
// 3. Недельный календарь текущего специалиста (WeekGrid)
// 4. BookingBar (при выборе свободного слота)
// 5. Если нет подписок — кнопки «Подписаться на календарь» и «Запросить свой календарь»
// 6. AdminGuard: если mustChangePassword — показать ChangePasswordForm

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCalendarStore } from '../store/calendarStore';
import WeekGrid from '../components/Calendar/WeekGrid';
import WeekNavigator from '../components/Calendar/WeekNavigator';
import BookingBar from '../components/Calendar/BookingBar';
import ChangePasswordModal from '../components/UI/ChangePasswordModal';
import SubscribeModal from '../components/UI/SubscribeModal';
import PromoModal from '../components/UI/PromoModal';
import { useToastStore } from '../components/UI/Toast';

export default function UserDashboard() {
  const { user } = useAuthStore();
  const { 
    subscriptions, 
    currentCalendar, 
    upcomingBooking, 
    slots, 
    weekStart, 
    selectedSlotId, 
    selectSlot,
    loadSubscriptions, 
    loadUpcoming,
    switchCalendar,
    requestCalendarAccess 
  } = useCalendarStore();

  const [passwordFormVisible, setPasswordFormVisible] = useState(user?.mustChangePassword || false);
  const [subscribeModalVisible, setSubscribeModalVisible] = useState(false);
  const [promoModalVisible, setPromoModalVisible] = useState(false);
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);
  const showToast = useToastStore((s) => s.show);

  useEffect(() => {
    loadSubscriptions().then(() => {
      // Auto-select first calendar if none selected
      const unsubscribed = useCalendarStore.getState().subscriptions;
      if (unsubscribed.length > 0 && !currentCalendar) {
        switchCalendar(unsubscribed[0].id);
      }
    });
    loadUpcoming();
  }, []);

  const handleSlotClick = (slot: any) => {
    if (slot.isOpen && !slot.isBooked) {
      selectSlot(slot.id === selectedSlotId ? null : slot.id);
    }
  };

  const handleRequestCalendarAccess = async () => {
    try {
      setIsRequestingAccess(true);
      await requestCalendarAccess();
      showToast('Запрос отправлен. Ожидайте одобрения от администратора.', 'success');
    } catch (error: any) {
      showToast(error.message || 'Не удалось отправить запрос', 'error');
    } finally {
      setIsRequestingAccess(false);
    }
  };

  return (
    <div className="page" style={{ paddingBottom: selectedSlotId ? 100 : 40 }}>
      {/* iOS Styled Header */}
      <div style={{
        padding: 'max(env(safe-area-inset-top), 20px) var(--ios-inset) 12px',
        background: 'var(--bg-primary)',
        marginBottom: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: 'var(--font-size-title1)', fontWeight: 700, margin: 0 }}>
          Привет, {user?.name || user?.email?.split('@')[0]}
        </h1>
        <div style={{ display: 'flex', gap: 12 }}>
          {user?.role === 'ADMIN' && (
            <Link to="/admin" className="btn btn-sm" style={{ background: 'var(--ios-purple)', color: '#fff', borderRadius: 20 }}>
              👑 Админка
            </Link>
          )}
          <Link to="/settings" style={{ fontSize: 24, textDecoration: 'none' }}>
            ⚙️
          </Link>
        </div>
      </div>

      <div style={{ padding: '0 var(--ios-inset)' }}>
        
        {/* Password Change Banner - shown if user must change password */}
        {passwordFormVisible && (
          <div className="card" style={{ marginBottom: 16, background: 'rgba(255, 159, 10, 0.15)', borderColor: 'var(--ios-orange)' }}>
            <h3 style={{ color: 'var(--ios-orange)', margin: '0 0 8px 0', fontSize: 'var(--font-size-headline)' }}>
              ⚠️ Обновите пароль
            </h3>
            <p style={{ margin: '0 0 12px 0', fontSize: 'var(--font-size-subheadline)', color: 'var(--text-secondary)' }}>
              Вам был назначен временный пароль. Пожалуйста, измените его.
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => setPasswordFormVisible(true)}>
              Сменить сейчас
            </button>
          </div>
        )}

        {/* Upcoming Banner */}
        {upcomingBooking && (
          <div style={{
            background: 'linear-gradient(135deg, var(--ios-blue), #5E5CE6)',
            borderRadius: 'var(--radius-card)',
            padding: 20,
            marginBottom: 24,
            color: '#fff',
            boxShadow: '0 8px 24px rgba(10, 132, 255, 0.3)'
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: 'var(--font-size-subheadline)', opacity: 0.9, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Ближайшая запись
            </p>
            <h2 style={{ margin: '0 0 4px 0', fontSize: 'var(--font-size-title2)' }}>
              {new Date(upcomingBooking.date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            <div style={{ fontSize: 'var(--font-size-headline)', marginBottom: 12 }}>
              {upcomingBooking.startTime} – {upcomingBooking.endTime}
            </div>
            <div style={{ 
              background: 'rgba(255,255,255,0.2)', 
              padding: '6px 12px', 
              borderRadius: 20, 
              display: 'inline-block',
              fontSize: 'var(--font-size-caption1)',
              fontWeight: 600
            }}>
              {upcomingBooking.calendarTitle}
            </div>
          </div>
        )}

        {/* Subscriptions / Calendar View */}
        {subscriptions.length > 0 ? (
          <>
            {/* iOS Segmented Control for calendars if > 1 */}
            {subscriptions.length > 1 && (
              <div style={{
                display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16, 
                WebkitOverflowScrolling: 'touch', margin: '0 -16px', padding: '0 16px 16px'
              }}>
                {subscriptions.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => switchCalendar(sub.id)}
                    style={{
                      background: currentCalendar?.id === sub.id ? 'var(--text-primary)' : 'var(--card-bg)',
                      color: currentCalendar?.id === sub.id ? 'var(--bg-primary)' : 'var(--text-primary)',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: 20,
                      fontSize: 'var(--font-size-subheadline)',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}
                  >
                    {sub.title}
                  </button>
                ))}
              </div>
            )}

            {currentCalendar && (
              <div style={{ marginTop: 8 }}>
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
            )}
          </>
        ) : (
          <div className="card" style={{ textAlign: 'center', marginTop: 40, padding: 32 }}>
            <div 
              style={{
                width: 64, height: 64, borderRadius: 16, background: 'var(--system-gray6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, margin: '0 auto 20px', color: 'var(--ios-blue)',
                cursor: 'pointer'
              }}
              onClick={() => setSubscribeModalVisible(true)}
            >
              +
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 'var(--font-size-headline)' }}>Нет подписок</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 'var(--font-size-subheadline)', lineHeight: 1.4 }}>
              Вы пока не подписаны ни на один календарь специалиста.
            </p>
            <button 
              className="btn btn-primary btn-block" 
              style={{ marginBottom: 12, borderRadius: 12 }}
              onClick={() => setSubscribeModalVisible(true)}
            >
              Подписаться по коду
            </button>
            <button 
              className="btn" 
              style={{ background: 'var(--system-gray5)', color: 'var(--text-primary)', width: '100%', borderRadius: 12 }}
              onClick={handleRequestCalendarAccess}
              disabled={isRequestingAccess}
            >
              {isRequestingAccess ? 'Отправка...' : 'Стать специалистом'}
            </button>
          </div>
        )}
      </div>

      {selectedSlotId && <BookingBar />}

      <ChangePasswordModal 
        isOpen={passwordFormVisible}
        onClose={() => setPasswordFormVisible(false)}
        onSuccess={() => setPasswordFormVisible(false)}
      />
      <SubscribeModal 
        isOpen={subscribeModalVisible}
        onClose={() => setSubscribeModalVisible(false)}
        onSuccess={() => setSubscribeModalVisible(false)}
      />
      <PromoModal 
        isOpen={promoModalVisible}
        onClose={() => setPromoModalVisible(false)}
        onSuccess={() => setPromoModalVisible(false)}
      />
    </div>
  );
}
