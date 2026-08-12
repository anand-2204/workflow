import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { Alert, type AlertType } from './Alert';

interface AlertContextType {
  showAlert: (props: AlertOptions) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  hideAlert: () => void;
}

interface AlertOptions {
  type: AlertType;
  title?: string;
  message: string;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider = ({ children }: AlertProviderProps) => {
  const [alertProps, setAlertProps] = useState<AlertOptions | null>(null);
  const [key, setKey] = useState(0);

  const showAlert = useCallback((props: AlertOptions) => {
    setAlertProps(props);
    setKey(prev => prev + 1);
  }, []);

  const hideAlert = useCallback(() => {
    setAlertProps(null);
  }, []);

  const showSuccess = useCallback((message: string, title?: string) => {
    showAlert({ type: 'success', message, title });
  }, [showAlert]);

  const showError = useCallback((message: string, title?: string) => {
    showAlert({ type: 'error', message, title });
  }, [showAlert]);

  const showWarning = useCallback((message: string, title?: string) => {
    showAlert({ type: 'warning', message, title });
  }, [showAlert]);

  const showInfo = useCallback((message: string, title?: string) => {
    showAlert({ type: 'info', message, title });
  }, [showAlert]);

  return (
    <AlertContext.Provider value={{ showAlert, showSuccess, showError, showWarning, showInfo, hideAlert }}>
      {children}
      {alertProps && (
        <Alert
          key={key}
          {...alertProps}
          onClose={hideAlert}
          isVisible={true}
        />
      )}
    </AlertContext.Provider>
  );
};