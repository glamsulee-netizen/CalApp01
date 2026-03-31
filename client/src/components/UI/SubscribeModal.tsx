import React, { useState } from 'react';
import Modal from './Modal';
import { useCalendarStore } from '../../store/calendarStore';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SubscribeModal({ isOpen, onClose, onSuccess }: SubscribeModalProps) {
  const { subscribeToCalendar, isLoading } = useCalendarStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!code.trim()) {
      setError('Введите код');
      return;
    }
    try {
      await subscribeToCalendar(code.trim());
      setCode('');
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Ошибка при подписке');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Добавить подписку"
      message="Введите уникальный код календаря, который вам скинул специалист"
      actions={[
        { label: 'Отмена', onClick: onClose, style: 'default' },
        { label: isLoading ? 'Добавление...' : 'Подписаться', onClick: handleSubmit, style: 'cancel' }
      ]}
    >
      <div style={{ padding: '0 16px 16px' }}>
        {error && <div style={{ color: 'var(--ios-red)', fontSize: '13px', marginBottom: '8px', textAlign: 'center' }}>{error}</div>}
        <input
          className="form-control"
          type="text"
          placeholder="Код календаря (например: AB123XYZ)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
    </Modal>
  );
}
