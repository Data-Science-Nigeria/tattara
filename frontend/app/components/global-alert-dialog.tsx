'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useAlertStore } from '../store/use-alert-store';
import { toast } from 'sonner';

const variantClasses = {
  delete: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  logout: 'bg-destructive text-white hover:bg-destructive/90',
  success: 'bg-green-600 text-primary-foreground hover:bg-green-600/90',
  error: 'bg-red-600 text-primary-foreground hover:bg-red-600/90',
  info: 'bg-blue-600 text-primary-foreground hover:bg-blue-600/90',
  warning: 'bg-yellow-600 text-primary-foreground hover:bg-yellow-600/90',
};

export function GlobalAlertDialog() {
  const { isOpen, type, options, isLoading, closeAlert, setLoading } =
    useAlertStore();
  const {
    title,
    description,
    cancelText = 'Cancel',
    actionText = 'Continue',
    onAction,
    onCancel,
    showLoading = true,
  } = options;

  const handleAction = async () => {
    if (!onAction) {
      closeAlert();
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
      }

      await onAction();

      if (showLoading) {
        closeAlert();
      }
    } catch (error) {
      setLoading(false);
      toast.error(
        'An error occurred while performing the action. Please try again.'
      );
      console.error('Action failed:', error);
    }
  };

  const handleCancel = () => {
    if (isLoading) return; // Prevent cancel during loading

    onCancel?.();
    closeAlert();
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => !open && !isLoading && closeAlert()}
    >
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold">
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-muted-foreground">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAction}
            disabled={isLoading}
            className={`${variantClasses[type]} flex items-center justify-center gap-2`}
          >
            {isLoading && showLoading && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {actionText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
