import React, { useState, useEffect, useCallback } from 'react';
import { LuTriangleAlert, LuX } from 'react-icons/lu';

export type ConfirmationMode = 'button' | 'type';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string;
  itemName?: string;
  confirmationMode?: ConfirmationMode;
  isLoading?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Confirmation',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  itemName = '',
  confirmationMode = 'button',
  isLoading = false,
  confirmButtonText = 'Delete',
  cancelButtonText = 'Cancel',
}) => {
  const [typedName, setTypedName] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  // Reset typed name when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTypedName('');
      setIsConfirming(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading && !isConfirming) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, isConfirming, onClose]);

  const isTypeConfirmValid = confirmationMode === 'type' 
    ? typedName.trim().toLowerCase() === itemName.trim().toLowerCase()
    : true;

  const canConfirm = confirmationMode === 'button' || isTypeConfirmValid;

  const handleConfirm = useCallback(async () => {
    if (!canConfirm || isLoading || isConfirming) return;
    
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  }, [canConfirm, isLoading, isConfirming, onConfirm]);

  if (!isOpen) return null;

  const loading = isLoading || isConfirming;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 dark:bg-black/70 transition-opacity"
        onClick={!loading ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-white dark:bg-slate-800 rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <LuTriangleAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {message}
          </p>

          {confirmationMode === 'type' && itemName && (
            <div className="space-y-2">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                To confirm, type <span className="font-semibold text-red-600 dark:text-red-400">"{itemName}"</span> below:
              </p>
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                disabled={loading}
                placeholder={`Type "${itemName}" to confirm`}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-red-500 dark:focus:border-red-400 focus:ring-1 focus:ring-red-500 dark:focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                autoFocus
              />
              {typedName && !isTypeConfirmValid && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Name does not match. Please type the exact name.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelButtonText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? 'Deleting...' : confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
