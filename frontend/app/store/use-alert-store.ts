import { create } from 'zustand';

export type AlertType =
  | 'delete'
  | 'logout'
  | 'success'
  | 'error'
  | 'info'
  | 'warning';

export type AlertOptions = {
  title: string;
  description?: string;
  cancelText?: string;
  actionText?: string;
  onAction?: () => void | Promise<void>;
  onCancel?: () => void;
  showLoading?: boolean;
};

type AlertStore = {
  isOpen: boolean;
  type: AlertType;
  options: AlertOptions;
  isLoading: boolean;
  showAlert: (type: AlertType, options: AlertOptions) => void;
  closeAlert: () => void;
  setLoading: (isLoading: boolean) => void;
};

export const useAlertStore = create<AlertStore>((set) => ({
  isOpen: false,
  type: 'info',
  isLoading: false,
  options: {
    title: '',
    description: '',
    cancelText: 'Cancel',
    actionText: 'Continue',
    showLoading: true,
  },
  showAlert: (type, options) =>
    set({
      isOpen: true,
      type,
      options: {
        showLoading: true,
        ...options,
      },
      isLoading: false,
    }),
  closeAlert: () => set({ isOpen: false, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
