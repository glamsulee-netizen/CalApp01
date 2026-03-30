// ============================================
// CalApp01 — QRCodeView (QR-код календаря и оплаты)
// ============================================
// AGENT_INSTRUCTION:
// Показывает QR-код для:
// 1. Ссылки на календарь (shareLink) — чтобы клиенты сканировали и подписывались
// 2. Ссылки на оплату (paymentLink) — QR для перевода
// Переключатель между двумя режимами.
// Использует библиотеку qrcode.react

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeViewProps {
  calendarShareUrl: string;
  calendarCode: string;
  paymentLink?: string;
  onClose: () => void;
}

type QRMode = 'calendar' | 'payment';

export default function QRCodeView({ calendarShareUrl, calendarCode, paymentLink, onClose }: QRCodeViewProps) {
  const [mode, setMode] = useState<QRMode>('calendar');

  return (
    <>
      <div className="bottom-sheet-overlay" onClick={onClose} />
      <div className="bottom-sheet" style={{ textAlign: 'center' }}>
        <div className="bottom-sheet-handle" />

        {/* Переключатель */}
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <button
            className={`btn btn-sm ${mode === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('calendar')}
          >
            Календарь
          </button>
          {paymentLink && (
            <button
              className={`btn btn-sm ${mode === 'payment' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('payment')}
            >
              Оплата
            </button>
          )}
        </div>

        {/* QR-код */}
        <div style={{ background: 'white', padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-lg)', display: 'inline-block', marginBottom: 'var(--spacing-md)' }}>
          <QRCodeSVG
            value={mode === 'calendar' ? calendarShareUrl : (paymentLink || '')}
            size={220}
            level="M"
          />
        </div>

        {/* Информация */}
        {mode === 'calendar' ? (
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-sm)' }}>
              Наведите камеру для перехода к календарю
            </p>
            <p style={{ fontSize: 'var(--font-size-sm)' }}>
              Код подписки: <strong style={{ letterSpacing: '2px' }}>{calendarCode}</strong>
            </p>
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Отсканируйте для перевода оплаты
          </p>
        )}
      </div>
    </>
  );
}
