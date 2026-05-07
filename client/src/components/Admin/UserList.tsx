// ============================================
// CalApp01 — Admin UserList
// ============================================
// AGENT_INSTRUCTION:
// Таблица пользователей для админа. Поиск, фильтрация, пагинация.
// Действия: активировать/деактивировать, назначить ADMIN.

import React, { useState, useEffect } from 'react';
import { apiGet, apiPatch } from '../../api';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface PaginatedResponse {
  items: User[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadUsers();
  }, [search, page, limit]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<PaginatedResponse>(
        `/admin/users?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`
      );
      setUsers(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e) {
      console.error('Failed to load users', e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActive = async (userId: number, isActive: boolean) => {
    try {
      await apiPatch(`/admin/users/${userId}`, { isActive: !isActive });
      // Update local state
      setUsers(users.map((u: User) => u.id === userId ? { ...u, isActive: !isActive } : u));
    } catch (e) {
      console.error('Failed to toggle user active', e);
    }
  };

  const changeRole = async (userId: number, currentRole: string) => {
    let newRole = 'USER';
    if (currentRole === 'USER') {
      newRole = 'MASTER';
    } else if (currentRole === 'MASTER') {
      newRole = 'ADMIN';
    } else if (currentRole === 'ADMIN') {
      newRole = 'USER';
    }
    try {
      await apiPatch(`/admin/users/${userId}`, { role: newRole });
      // Update local state
      setUsers(users.map((u: User) => u.id === userId ? { ...u, role: newRole } : u));
    } catch (e) {
      console.error('Failed to change user role', e);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on new search
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  return (
    <div>
      {/* Search and controls */}
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap' }}>
        <input
          className="input"
          placeholder="Поиск по email или имени..."
          value={search}
          onChange={handleSearchChange}
          style={{ flex: 1, minWidth: 200 }}
        />
        <select
          className="form-control"
          value={limit}
          onChange={handleLimitChange}
          style={{ width: 120 }}
        >
          <option value={10}>10 на странице</option>
          <option value={20}>20 на странице</option>
          <option value={50}>50 на странице</option>
          <option value={100}>100 на странице</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-card)', border: '1px solid var(--border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-subheadline)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
              <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>ID</th>
              <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Email</th>
              <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Имя</th>
              <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Роль</th>
              <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Статус</th>
              <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Дата регистрации</th>
              <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Загрузка...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  {search ? 'Пользователи не найдены' : 'Нет пользователей'}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: 'var(--spacing-md)', color: 'var(--text-tertiary)' }}>{user.id}</td>
                  <td style={{ padding: 'var(--spacing-md)' }}>{user.email}</td>
                  <td style={{ padding: 'var(--spacing-md)' }}>{user.name || '—'}</td>
                  <td style={{ padding: 'var(--spacing-md)' }}>
                    <span
                      style={{
                        background: user.role === 'ADMIN' ? 'rgba(10, 132, 255, 0.1)' : user.role === 'MASTER' ? 'rgba(161, 90, 223, 0.1)' : 'rgba(120, 120, 128, 0.1)',
                        color: user.role === 'ADMIN' ? 'var(--ios-blue)' : user.role === 'MASTER' ? 'var(--ios-purple)' : 'var(--text-secondary)',
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: 'var(--font-size-caption1)',
                        fontWeight: 600,
                      }}
                    >
                      {user.role === 'ADMIN' ? 'Администратор' : user.role === 'MASTER' ? 'Мастер' : 'Пользователь'}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--spacing-md)' }}>
                    <span
                      style={{
                        background: user.isActive ? 'rgba(48, 209, 88, 0.1)' : 'rgba(255, 69, 58, 0.1)',
                        color: user.isActive ? 'var(--ios-green)' : 'var(--ios-red)',
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: 'var(--font-size-caption1)',
                        fontWeight: 600,
                      }}
                    >
                      {user.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>
                    {formatDate(user.createdAt)}
                  </td>
                  <td style={{ padding: 'var(--spacing-md)', display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button
                      className="btn btn-sm"
                      onClick={() => toggleActive(user.id, user.isActive)}
                      style={{
                        background: user.isActive ? 'var(--ios-red)' : 'var(--ios-green)',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: 'var(--font-size-caption1)',
                        cursor: 'pointer',
                      }}
                    >
                      {user.isActive ? 'Деактивировать' : 'Активировать'}
                    </button>
                    <button
                      className="btn btn-sm"
                      onClick={() => changeRole(user.id, user.role)}
                      style={{
                        background: 'var(--ios-blue)',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: 'var(--font-size-caption1)',
                        cursor: 'pointer',
                      }}
                    >
                      {user.role === 'ADMIN' ? 'Сделать USER' : user.role === 'MASTER' ? 'Сделать ADMIN' : 'Сделать MASTER'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--spacing-md)', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-subheadline)' }}>
            Показано {users.length} из {total} пользователей
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <button
              className="btn btn-sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                background: 'var(--bg-tertiary)',
                color: page === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 6,
                cursor: page === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Назад
            </button>
            <span style={{ padding: '8px 16px', color: 'var(--text-secondary)' }}>
              Страница {page} из {totalPages}
            </span>
            <button
              className="btn btn-sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                background: 'var(--bg-tertiary)',
                color: page === totalPages ? 'var(--text-tertiary)' : 'var(--text-primary)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 6,
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              Вперед
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
