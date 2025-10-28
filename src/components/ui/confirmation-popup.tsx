import React from 'react';

interface ConfirmationPopupProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  position: { top: number; left: number };
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationPopup({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  position,
  onConfirm,
  onCancel
}: ConfirmationPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onCancel}>
      <div 
        className="absolute bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[160px] max-w-[180px]"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: 'translate(-100%, 0)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs text-black mb-2">This action cannot be undone.</p>
        <div className="flex gap-1 justify-end">
          <button
            onClick={onCancel}
            className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

