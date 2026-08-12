import { useState, useCallback } from 'react';
import { ConfirmDialog, type ConfirmType } from '../components/common/ConfirmDialog';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
}

export const useConfirm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: '' });
  const [resolve, setResolve] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolveFn) => {
      setOptions(options);
      setIsOpen(true);
      setResolve(() => resolveFn);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolve) {
      resolve(true);
      setResolve(null);
    }
  }, [resolve]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (resolve) {
      resolve(false);
      setResolve(null);
    }
  }, [resolve]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (resolve) {
      resolve(false);
      setResolve(null);
    }
  }, [resolve]);

  const ConfirmComponent = (
    <ConfirmDialog
      isOpen={isOpen}
      title={options.title}
      message={options.message}
      confirmText={options.confirmText}
      cancelText={options.cancelText}
      type={options.type}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      onClose={handleClose}
    />
  );

  return { confirm, ConfirmComponent };
};