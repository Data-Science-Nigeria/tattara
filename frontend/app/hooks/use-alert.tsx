import {
  useAlertStore,
  AlertType,
  AlertOptions,
} from '@/app/store/use-alert-store';

export const useAlert = () => {
  const { showAlert } = useAlertStore();

  const alert = (type: AlertType, options: AlertOptions) => {
    showAlert(type, options);
  };

  return {
    alert,
    delete: (options: AlertOptions) => alert('delete', options),
    logout: (options: AlertOptions) => alert('logout', options),
    success: (options: AlertOptions) => alert('success', options),
    error: (options: AlertOptions) => alert('error', options),
    info: (options: AlertOptions) => alert('info', options),
    warning: (options: AlertOptions) => alert('warning', options),
  };
};
