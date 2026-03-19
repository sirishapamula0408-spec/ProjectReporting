import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { Notification, NotificationGroup } from '@progress/kendo-react-notification';
import { Fade } from '@progress/kendo-react-animation';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-dismiss success after 4s, others after 6s
    const timeout = type === 'success' ? 4000 : type === 'error' ? 0 : 6000;
    if (timeout > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, timeout);
    }
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <NotificationGroup
        style={{ position: 'fixed', top: 16, right: 16, zIndex: 10000 }}
      >
        <Fade>
          {toasts.map((toast) => (
            <Notification
              key={toast.id}
              type={{ style: toast.type, icon: true }}
              closable
              onClose={() => removeToast(toast.id)}
            >
              <span>{toast.message}</span>
            </Notification>
          ))}
        </Fade>
      </NotificationGroup>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
