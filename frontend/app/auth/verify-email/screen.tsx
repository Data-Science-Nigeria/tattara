'use client';

import { authControllerVerifyEmailMutation } from '@/client/@tanstack/react-query.gen';
import { Card, CardContent } from '../../../components/ui/card';
import Footer from '../../components/footer';
import { useAuthStore } from '@/app/store/use-auth-store';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { VerificationContent } from './components/verification-content';
import { useResendEmail } from './hooks/use-resend-email';

type VerificationState = 'loading' | 'success' | 'error';

export function Screen() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { auth } = useAuthStore();
  const { isLoading: isResending, resendVerificationEmail } = useResendEmail();
  const [verificationState, setVerificationState] =
    useState<VerificationState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const verifyEmailMutation = useMutation({
    ...authControllerVerifyEmailMutation(),
  });

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setErrorMessage(
          'Please verify your email to continue. Click resend to get a new verification email.'
        );
        setVerificationState('error');
        return;
      }

      try {
        setVerificationState('loading');
        await verifyEmailMutation.mutateAsync({
          body: { token },
        });
        setVerificationState('success');
      } catch (error) {
        console.error('Email verification error:', error);
        const errorMsg = getApiErrorMessage(error);
        setErrorMessage(errorMsg);
        setVerificationState('error');
        toast.error(errorMsg);
      }
    };

    verify();
  }, [token, verifyEmailMutation]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5FF] px-6 py-12">
      <div className="w-full max-w-md">
        <Card className="mb-14 rounded-2xl border-[#DBDCEA] shadow-lg">
          <CardContent className="p-8">
            <VerificationContent
              state={verificationState}
              error={errorMessage}
              email={auth?.email}
              onResendEmail={resendVerificationEmail}
              isResending={isResending}
            />
          </CardContent>
        </Card>
        <Footer />
      </div>
    </div>
  );
}
