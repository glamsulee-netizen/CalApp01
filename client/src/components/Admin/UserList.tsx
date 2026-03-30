// ============================================
// CalApp01 — Admin UserList
// ============================================
// AGENT_INSTRUCTION:
// Таблица пользователей для админа. Поиск, фильтрация, пагинация.
// Действия: активировать/деактивировать, назначить ADMIN.

import React, { useState, useEffect } from 'react';
import { apiGet, apiPatch } from '../../api';

interface User {
  id: number; email: string; name: string; role: string;
  isActive: boolean; createdAt: string;
}

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadUsers(); }, [search]);

  const loadUsers = async () => {
    try {
      const data = await apiGet<User[]>(`/admin/users?search=${search}`);
      setUsers(data);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const toggleActive = async (userId: number, isActive: boolean) => {
    await apiPatch(`/admin/users/${userId}`, { isActive: !isActive });
    loadUsers();
  };

  return (
    <div>
      <input className="input" placeholder="Поиск по email или имени..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 'var(--spacing-md)' }} />
      {isLoading ? <div className="loading-spinner" /> : users.map((u) => (
        <div key={u.id} className="card" style={{ marginBottom: 'var(--spacing-sm)', padding: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>{u.name || u.email}</strong>
            <br /><small style={{ color: 'var(--color-text-secondary)' }}>{u.email} · {u.role}</small>
          </div>
          <button className={`btn btn-sm ${u.isActive ? 'btn-secondary' : 'btn-primary'}`} onClick={() => toggleActive(u.id, u.isActive)}>
            {u.isActive ? 'Деактивировать' : 'Активировать'}
          </button>
        </div>
      ))}
    </div>
  );
}
