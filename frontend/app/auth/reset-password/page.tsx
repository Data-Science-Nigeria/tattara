'use client';
import Link from 'next/link';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5FF] px-6 py-12">
      <div className="w-full max-w-md">
        <Card className="mb-20 rounded-2xl border-[#DBDCEA] shadow-lg">
          <CardContent className="p-8">
            <div className="mb-8 text-center">
              <h1 className="mb-4 text-2xl font-bold text-[#373844]">
                Reset Password
              </h1>
              <p className="text-sm text-[#5C5D6C]">
                Enter your new password to reset it
              </p>
            </div>

            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter your Password"
                    className="mt-1 w-full rounded-lg border border-[#DBDCEA] bg-[#F2F3FF] p-3 placeholder:text-xs placeholder:text-[#525F76] focus:border-green-500 focus:ring-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-4 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Confirm your password"
                    className="mt-1 w-full rounded-lg border border-[#DBDCEA] bg-[#F2F3FF] p-3 placeholder:text-xs placeholder:text-[#525F76] focus:border-green-500 focus:ring-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute top-1/2 right-4 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <Link href="/auth/verify-email">
                <Button className="mt-1 mb-4 w-full rounded-md bg-[#008647] py-6 text-center hover:bg-green-700">
                  Continue
                </Button>
              </Link>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-[#5C5D6C]">
                  Don&apos;t have an Admin Account?
                </span>
                <Link href={'/auth/signup'} className="text-xs text-[#008647]">
                  Create Account
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
        <footer className="px-6 py-8">
          <div className="mx-auto flex max-w-6xl items-center justify-center gap-2">
            <span className="text-xl text-[#7987A0]">Designed by</span>
            <img src={'/logo.svg'} alt="logo" className="h-10" />
          </div>
        </footer>
      </div>
    </div>
  );
}
