'use client';

import Link from 'next/link';
import { Button } from '../../../../components/ui/button';

export function ForgotPasswordForm() {
  return (
    <div className="w-full max-w-[460px]">
      <form className="flex h-auto w-full flex-col justify-between rounded-2xl bg-white p-10 shadow-md">
        <div className="space-y-5">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-bold text-[#373844]">
              Forgot Password
            </h1>
            <p className="text-sm text-[#5C5D6C]">
              Enter your registered email to reset your password.
            </p>
          </div>
        </div>
        <div className="mt-8">
          <label className="block text-sm font-medium text-gray-600">
            Email address
          </label>
          <div className="relative">
            <input
              type="email"
              placeholder="Enter your Email Address"
              className="mt-1 w-full rounded-lg border border-[#DBDCEA] bg-[#F2F3FF] p-3 placeholder:text-xs placeholder:text-[#525F76] focus:border-green-500 focus:ring-green-500"
            />
            <img
              src={'/sms.svg'}
              alt="mail-icon"
              className="absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 transform"
            />
          </div>
          <div className="mt-12">
            <Link href="/auth/reset-email-sent">
              <Button className="mt-1 mb-4 w-full rounded-md bg-[#008647] py-6 text-center">
                Reset Password
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
