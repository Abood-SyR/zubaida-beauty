'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppColors } from '@/constants/app_colors';

type ToastKind = 'success' | 'error' | 'info';
type ToastMessage = { id: number; message: string; kind: ToastKind };
type ToastContextValue = (message: string, kind?: ToastKind) => void;

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const nextId = useRef(0);
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback<ToastContextValue>((message, kind = 'success') => {
    if (timeoutId.current) clearTimeout(timeoutId.current);
    const id = ++nextId.current;
    setToast({ id, message, kind });
    timeoutId.current = setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
      timeoutId.current = null;
    }, 3200);
  }, []);

  useEffect(
    () => () => {
      if (timeoutId.current) clearTimeout(timeoutId.current);
    },
    [],
  );

  const toastColors = {
    success: AppColors.deepRose,
    error: '#b42318',
    info: AppColors.primaryRose,
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="true">
        {toast && (
          <div
            key={toast.id}
            className="toast-message"
            role={toast.kind === 'error' ? 'alert' : 'status'}
            style={{
              backgroundColor: toastColors[toast.kind],
              color: AppColors.surfaceWhite,
            }}
          >
            <span aria-hidden="true" className="toast-indicator">
              {toast.kind === 'error' ? '!' : toast.kind === 'success' ? '✓' : 'i'}
            </span>
            <span className="flex-1">{toast.message}</span>
            <button
              type="button"
              aria-label="إغلاق الإشعار"
              onClick={() => {
                if (timeoutId.current) clearTimeout(timeoutId.current);
                timeoutId.current = null;
                setToast(null);
              }}
              className="toast-close"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const showToast = useContext(ToastContext);
  if (!showToast) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return showToast;
}
