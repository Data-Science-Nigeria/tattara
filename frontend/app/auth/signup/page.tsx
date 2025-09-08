import React from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import Link from 'next/link';
import { Button } from '../../../components/ui/button';

const page = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5FF] px-6 py-12">
      <div className="w-full max-w-md">
        <Card className="mb-14 rounded-2xl border-[#DBDCEA] shadow-lg">
          <CardContent className="p-8">
            <div className="mb-8 text-center">
              <h1 className="mb-4 text-2xl font-bold text-[#373844]">
                Create Your Account
              </h1>
              <p className="text-sm text-[#5C5D6C]">
                Get started in just a few steps.
              </p>
            </div>

            <form className="space-y-6 sm:px-6 lg:px-8">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-600">
                  Email Address
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
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter your Password"
                  className="mt-1 w-full rounded-lg border border-[#DBDCEA] bg-[#F2F3FF] p-3 placeholder:text-xs placeholder:text-[#525F76] focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Confirm your password"
                  className="mt-1 w-full rounded-lg border border-[#DBDCEA] bg-[#F2F3FF] p-3 placeholder:text-xs placeholder:text-[#525F76] focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <Link href="/auth/verify-email">
                <Button className="mt-1 mb-4 w-full rounded-md bg-[#008647] py-6 text-center">
                  Continue
                </Button>
              </Link>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-[#5C5D6C]">
                  Don&apos;t have an Admin Account?
                </span>
                <Link href={''} className="text-xs text-[#008647]">
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
};

export default page;
