import React, { useState } from 'react';
import Modal from './Modal';
import { useAuthStore } from '../../store/authStore';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose, onSuccess }: ChangePasswordModalProps) {
  const { changePassword, error: storeError, isLoading } = useAuthStore();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async () => {
    setLocalError('');
    if (!newPassword || newPassword.length < 6) {
      setLocalError('Пароль должен быть минимум 6 символов');
      return;
    }
    try {
      await changePassword(oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      onSuccess();
      onClose();
    } catch (e: any) {
      setLocalError(e.message || 'Ошибка смены пароля');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Смена пароля"
      message="Пожалуйста, введите ваш текущий и новый пароли"
      actions={[
        { label: 'Отмена', onClick: onClose, style: 'default' },
        { label: isLoading ? 'Сохранение...' : 'Сохранить', onClick: handleSubmit, style: 'cancel' }
      ]}
    >
      <div style={{ padding: '0 16px 16px' }}>
        {(localError || storeError) && <div style={{ color: 'var(--ios-red)', fontSize: '13px', marginBottom: '8px', textAlign: 'center' }}>{localError || storeError}</div>}
        <input
          className="form-control"
          type="password"
          placeholder="Текущий пароль"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          style={{ marginBottom: '12px' }}
        />
        <input
          className="form-control"
          type="password"
          placeholder="Новый пароль"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>
    </Modal>
  );
}
