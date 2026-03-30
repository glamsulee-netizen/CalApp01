// ============================================
// CalApp01 — BottomSheet (iOS Action Sheet)
// ============================================
// iOS-style bottom sheet with blur, handle, spring animation.
// Matches UIKit's presentationDetents behaviour.

import React, { useEffect } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="bottom-sheet-overlay" onClick={onClose} />
      <div className="bottom-sheet">
        <div className="bottom-sheet-handle" />
        {title && (
          <div style={{
            textAlign: 'center',
            marginBottom: 'var(--spacing-md)',
            paddingBottom: 'var(--spacing-md)',
            borderBottom: '0.5px solid var(--separator)',
          }}>
            <span className="headline">{title}</span>
          </div>
        )}
        {children}
      </div>
    </>
  );
}
