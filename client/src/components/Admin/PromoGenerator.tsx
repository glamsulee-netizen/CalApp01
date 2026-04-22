// ============================================
// CalApp01 — PromoGenerator (Генератор промокодов)
// ============================================
// AGENT_INSTRUCTION:
// Интерфейс для админа: генерация промокодов подписки.
// Выбор: тип (месяц/год), количество (1-100). Кнопка «Сгенерировать».
// После генерации — показать список кодов (копирование по тапу).
// Ниже — таблица всех кодов с фильтрацией (использованные/свободные).

import React, { useState, useEffect } from 'react';
import { apiPost, apiGet } from '../../api';
import { useToastStore } from '../UI/Toast';

interface PromoCode {
  id: number;
  code: string;
  type: string;
  durationDays: number;
  isUsed: boolean;
  usedBy?: { email: string };
  activatedAt?: string;
  expiresAt?: string;
}

export default function PromoGenerator() {
  const [type, setType] = useState<'SUBSCRIPTION_MONTH' | 'SUBSCRIPTION_YEAR'>('SUBSCRIPTION_MONTH');
  const [count, setCount] = useState(5);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [allCodes, setAllCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'used' | 'free'>('all');
  const showToast = useToastStore((s) => s.show);

  useEffect(() => { loadCodes(); }, []);

  const loadCodes = async () => {
    try {
      const data = await apiGet<PromoCode[]>('/admin/promo');
      setAllCodes(data);
    } catch (e) { console.error(e); }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const data = await apiPost<{ codes: string[] }>('/admin/promo/generate', { type, count });
      setGeneratedCodes(data.codes);
      loadCodes();
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => showToast('Код скопирован', 'success'))
      .catch(() => showToast('Не удалось скопировать код', 'error'));
  };

  const filtered = allCodes.filter(c =>
    filter === 'all' ? true : filter === 'used' ? c.isUsed : !c.isUsed
  );

  return (
    <div>
      {/* Генератор */}
      <div className="card" style={{ marginBottom: 'var(--spacing-md)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Генерация промокодов</h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap' }}>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as any)} style={{ flex: 1 }}>
            <option value="SUBSCRIPTION_MONTH">Месяц (100₽)</option>
            <option value="SUBSCRIPTION_YEAR">Год (1000₽)</option>
          </select>
          <input className="input" type="number" min={1} max={100} value={count} onChange={(e) => setCount(parseInt(e.target.value) || 1)} style={{ width: 80 }} />
          <button className="btn btn-primary" onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? '...' : 'Создать'}
          </button>
        </div>

        {/* Новые коды */}
        {generatedCodes.length > 0 && (
          <div style={{ background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)' }}>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-success)', marginBottom: 'var(--spacing-sm)' }}>
              ✓ Создано {generatedCodes.length} кодов (тап для копирования):
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
              {generatedCodes.map((code) => (
                <span key={code} className="badge badge--accent" style={{ cursor: 'pointer', padding: '4px 12px' }} onClick={() => copyCode(code)}>
                  {code}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Список всех кодов */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h3>Все коды ({filtered.length})</h3>
          <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
            {(['all', 'free', 'used'] as const).map((f) => (
              <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
                {{ all: 'Все', free: 'Свободные', used: 'Исп.' }[f]}
              </button>
            ))}
          </div>
        </div>
        {filtered.map((c) => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--spacing-sm) 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 'var(--font-size-sm)' }}>
            <span style={{ fontFamily: 'monospace', letterSpacing: '2px' }}>{c.code}</span>
            <span>{c.isUsed ? <span className="badge badge--danger">Использован</span> : <span className="badge badge--success">Свободен</span>}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
