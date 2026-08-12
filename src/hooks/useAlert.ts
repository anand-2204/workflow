import { useCallback } from 'react';
import { useAlert } from '../components/common/AlertProvider';

export const useCustomAlert = () => {
  const { showAlert, showSuccess, showError, showWarning, showInfo, hideAlert } = useAlert();

  const showWorkflowError = useCallback((message: string) => {
    showError(message, 'Run Workflow');
  }, [showError]);

  const showWorkflowSuccess = useCallback((message: string) => {
    showSuccess(message, 'Workflow Executed');
  }, [showSuccess]);

  const showWorkflowWarning = useCallback((message: string) => {
    showWarning(message, 'Warning');
  }, [showWarning]);

  const showWorkflowInfo = useCallback((message: string) => {
    showInfo(message, 'Information');
  }, [showInfo]);

  return {
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideAlert,
    showWorkflowError,
    showWorkflowSuccess,
    showWorkflowWarning,
    showWorkflowInfo,
  };
};