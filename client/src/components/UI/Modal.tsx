// ============================================
// CalApp01 — Modal (iOS Alert Dialog)
// ============================================
// iOS-style centered alert with blur, scale-in animation.
// Matches UIKit's UIAlertController behaviour.

import React from 'react';

interface ModalAction {
  label: string;
  onClick: () => void;
  style?: 'default' | 'destructive' | 'cancel';
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  actions?: ModalAction[];
  children?: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, message, actions, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="ios-modal-overlay" onClick={onClose}>
      <div className="ios-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ios-modal__title">{title}</div>
        {message && <div className="ios-modal__message">{message}</div>}
        {children}
        {actions && actions.length > 0 && (
          <div className="ios-modal__actions">
            {actions.map((action, i) => (
              <button
                key={i}
                className={`ios-modal__btn ${action.style === 'destructive' ? 'ios-modal__btn--destructive' : ''} ${action.style === 'cancel' ? 'ios-modal__btn--bold' : ''}`}
                onClick={action.onClick}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
