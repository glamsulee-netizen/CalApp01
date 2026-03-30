// ============================================
// CalApp01 — Stats (Статистика платформы)
// ============================================
import React, { useEffect, useState } from 'react';
import { apiGet } from '../../api';

interface PlatformStats {
  totalUsers: number; totalSpecialists: number; activeCalendars: number;
  totalBookings: number; activeBookings: number; todayBookings: number;
}

export default function Stats() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    apiGet<PlatformStats>('/admin/stats').then(setStats).catch(console.error);
  }, []);

  if (!stats) return <div className="loading-spinner" />;

  const cards = [
    { label: 'Пользователей', value: stats.totalUsers, color: 'var(--color-accent)' },
    { label: 'Специалистов', value: stats.totalSpecialists, color: 'var(--color-success)' },
    { label: 'Активных календарей', value: stats.activeCalendars, color: 'var(--color-warning)' },
    { label: 'Записей сегодня', value: stats.todayBookings, color: 'var(--color-accent)' },
    { label: 'Активных бронирований', value: stats.activeBookings, color: 'var(--color-success)' },
    { label: 'Всего бронирований', value: stats.totalBookings, color: 'var(--color-text-secondary)' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 'var(--spacing-md)' }}>
      {cards.map((c) => (
        <div key={c.label} className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: c.color }}>{c.value}</div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}
