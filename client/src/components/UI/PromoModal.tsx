import React, { useState } from 'react';
import Modal from './Modal';
import { useCalendarStore } from '../../store/calendarStore';

interface PromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PromoModal({ isOpen, onClose, onSuccess }: PromoModalProps) {
  const { activatePromo, isLoading } = useCalendarStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!code.trim()) {
      setError('Введите код');
      return;
    }
    try {
      await activatePromo(code.trim());
      setCode('');
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Ошибка активации кода');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Стать специалистом"
      message="Для того чтобы создать свой календарь, активируйте специальный билет/промокод"
      actions={[
        { label: 'Отмена', onClick: onClose, style: 'default' },
        { label: isLoading ? 'Активация...' : 'Активировать', onClick: handleSubmit, style: 'cancel' }
      ]}
    >
      <div style={{ padding: '0 16px 16px' }}>
        {error && <div style={{ color: 'var(--ios-red)', fontSize: '13px', marginBottom: '8px', textAlign: 'center' }}>{error}</div>}
        <input
          className="form-control"
          type="text"
          placeholder="Промокод доступа"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
    </Modal>
  );
}
