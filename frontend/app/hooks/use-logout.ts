import { useRouter } from 'next/navigation';
import { authControllerLogoutMutation } from '@/client/@tanstack/react-query.gen';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { useAuthStore } from '@/app/store/use-auth-store';
import { useAlert } from './use-alert';

export const useLogout = () => {
  const { logout: logoutAlert } = useAlert();
  const router = useRouter();
  const { clearAuth } = useAuthStore();

  const logout = useMutation({
    ...authControllerLogoutMutation(),
  });

  const handleLogout = async () => {
    try {
      await logout.mutateAsync({});
      clearAuth();
      router.push('/auth/login');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const confirmLogout = () => {
    logoutAlert({
      title: 'Logout',
      description: 'Are you sure you want to logout?',
      actionText: 'Logout',
      onAction: handleLogout,
      showLoading: logout.isPending,
    });
  };

  return {
    handleLogout: confirmLogout,
  };
};
