'use client';

import { Button } from '@/components/ui/button';
import { LoaderCircle } from 'lucide-react';
import Link from 'next/link';

type VerificationState = 'loading' | 'success' | 'error';

interface VerificationContentProps {
  state: VerificationState;
  error?: string;
  email?: string;
  onResendEmail: () => void;
  isResending: boolean;
}

export const VerificationContent = ({
  state,
  error,
  email,
  onResendEmail,
  isResending,
}: VerificationContentProps) => {
  if (state === 'loading') {
    return (
      <div className="mb-4 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-[#373844]">
          Verifying Email
        </h1>
        <p className="text-sm text-[#5C5D6C]">
          Please wait while we verify your email...
        </p>
      </div>
    );
  }

  const isError = state === 'error';
  const title = `Email verification ${isError ? 'failed' : 'successful'}`;

  return (
    <div className="mb-4 text-center">
      <div
        className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${isError ? 'bg-red-100' : 'bg-green-100'}`}
      >
        {isError ? (
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
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
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>
      <h1 className="mb-2 text-2xl font-bold text-[#373844]">{title}</h1>

      {isError ? (
        <p className="text-sm text-[#5C5D6C]">{error || 'An error occurred'}</p>
      ) : (
        <p className="text-sm text-[#5C5D6C]">
          Congratulations! Your email account{' '}
          <span className="font-semibold text-[#008647]">{email}</span> has been
          verified
        </p>
      )}

      <div className="mt-4 space-y-4">
        {isError ? (
          <Button
            onClick={onResendEmail}
            disabled={isResending}
            className="mt-2 mb-2 w-full rounded-md bg-[#008647] py-6 text-center disabled:opacity-50"
          >
            {isResending ? 'Sending...' : 'Resend email'}
          </Button>
        ) : (
          <Link href="/auth/login">
            <Button className="mt-2 mb-2 w-full rounded-md bg-[#008647] py-6 text-center">
              Continue to login
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};
