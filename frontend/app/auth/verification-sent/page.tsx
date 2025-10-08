'use client';

import React from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import Footer from '../../components/footer';
import { useAuthStore } from '@/app/store/use-auth-store';
import { useResendEmailCooldown } from '../verify-email/hooks/use-resend-email-cooldown';

const Page = () => {
  const { auth } = useAuthStore();
  const {
    handleResendEmail,
    isDisabled,
    isLoading,
    cooldownTime,
    isOnCooldown,
  } = useResendEmailCooldown();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5FF] px-6 py-12">
      <div className="w-full max-w-md">
        <Card className="mb-14 rounded-2xl border-[#DBDCEA] shadow-lg">
          <CardContent className="p-8">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h1 className="mb-2 text-2xl font-bold text-[#373844]">
                Please verify your email
              </h1>
              <p className="text-sm text-[#5C5D6C]">
                A verification email has been sent to your email address{' '}
                <span className="font-semibold text-[#008647]">
                  {auth?.email}
                </span>
                .
                <br />
                Please check your inbox and follow the instructions to verify
                your email.
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleResendEmail}
                disabled={isDisabled}
                className="mt-2 mb-2 w-full rounded-md bg-[#008647] py-6 text-center disabled:opacity-50"
              >
                {isLoading
                  ? 'Sending...'
                  : isOnCooldown
                    ? `Resend email (${cooldownTime})`
                    : 'Resend email'}
              </Button>
            </div>
          </CardContent>
        </Card>
        <Footer />
      </div>
    </div>
  );
};

export default Page;
