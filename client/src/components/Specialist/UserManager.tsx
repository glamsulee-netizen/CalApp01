// ============================================
// CalApp01 — UserManager (Управление пользователями)
// ============================================
// AGENT_INSTRUCTION:
// Список участников календаря для специалиста.
// Показывает: имя, email, роль (badge), кол-во активных бронирований.
// Действия: изменить роль (ZOMBIE→CLIENT→SPECIALIST), изменить maxBookings.
// Индикатор новых пользователей (ZOMBIE → нужно одобрить).

import React, { useEffect, useState } from 'react';
import { apiGet, apiPatch } from '../../api';

interface Member {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  role: 'SPECIALIST' | 'CLIENT' | 'ZOMBIE';
  maxBookings: number;
  activeBookings: number;
}

interface UserManagerProps {
  calendarId: number;
}

const ROLE_LABELS: Record<string, string> = {
  SPECIALIST: 'Специалист',
  CLIENT: 'Клиент',
  ZOMBIE: 'Ожидает',
};

const ROLE_BADGE: Record<string, string> = {
  SPECIALIST: 'badge--accent',
  CLIENT: 'badge--success',
  ZOMBIE: 'badge--warning',
};

export default function UserManager({ calendarId }: UserManagerProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, [calendarId]);

  const loadMembers = async () => {
    try {
      const data = await apiGet<Member[]>(`/calendar/${calendarId}/members`);
      setMembers(data);
    } catch (error) {
      console.error('Ошибка загрузки участников:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRole = async (memberId: number, role: string) => {
    try {
      await apiPatch(`/calendar/${calendarId}/members/${memberId}`, { role });
      loadMembers();
    } catch (error) {
      console.error('Ошибка обновления роли:', error);
    }
  };

  const updateMaxBookings = async (memberId: number, maxBookings: number) => {
    try {
      await apiPatch(`/calendar/${calendarId}/members/${memberId}`, { maxBookings });
      loadMembers();
    } catch (error) {
      console.error('Ошибка обновления лимита:', error);
    }
  };

  if (isLoading) return <div className="loading-spinner" />;

  return (
    <div>
      <h3 style={{ marginBottom: 'var(--spacing-md)' }}>
        Участники ({members.length})
      </h3>
      {members.map((member) => (
        <div key={member.id} className="card" style={{ marginBottom: 'var(--spacing-sm)', padding: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
            <div>
              <strong>{member.userName || member.userEmail}</strong>
              <br />
              <small style={{ color: 'var(--color-text-secondary)' }}>{member.userEmail}</small>
            </div>
            <span className={`badge ${ROLE_BADGE[member.role]}`}>{ROLE_LABELS[member.role]}</span>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', fontSize: 'var(--font-size-sm)' }}>
            {member.role === 'ZOMBIE' && (
              <button className="btn btn-sm btn-primary" onClick={() => updateRole(member.id, 'CLIENT')}>
                Одобрить
              </button>
            )}
            {member.role === 'CLIENT' && (
              <>
                <button className="btn btn-sm btn-secondary" onClick={() => updateRole(member.id, 'ZOMBIE')}>
                  Заблокировать
                </button>
                <button className="btn btn-sm btn-secondary" onClick={() => updateRole(member.id, 'SPECIALIST')}>
                  → Специалист
                </button>
              </>
            )}
            <span style={{ color: 'var(--color-text-muted)', alignSelf: 'center' }}>
              Бронь: {member.activeBookings}/{member.maxBookings}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
