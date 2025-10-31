import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/store/use-auth-store';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { authControllerResendVerificationMutation } from '@/client/@tanstack/react-query.gen';

export const useResendEmail = () => {
  const resendEmail = useMutation({
    ...authControllerResendVerificationMutation(),
  });

  const { auth } = useAuthStore();
  const router = useRouter();

  const resendVerificationEmail = async () => {
    try {
      await resendEmail.mutateAsync({
        body: {
          email: auth.email,
        },
      });
      router.push('/auth/verification-sent');
      toast.success('Verification email sent');
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error));
    }
  };

  return { resendVerificationEmail, isLoading: resendEmail.isPending };
};
