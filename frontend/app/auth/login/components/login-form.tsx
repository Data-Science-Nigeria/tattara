import Link from 'next/link';
import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';

export function LoginForm() {
  return (
    <div className="w-full max-w-[460px]">
      <Card className="rounded-2xl border-[#DBDCEA] py-12 shadow-lg">
        <CardContent>
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-bold text-[#373844]">
              Log Into Your Account
            </h1>
            <p className="text-sm text-[#5C5D6C]">
              Enter your details to access your account
            </p>
          </div>
          <form className="space-y-5">
            <div className="mb-3">
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
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-600">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your Password"
                className="mt-1 w-full rounded-lg border border-[#DBDCEA] bg-[#F2F3FF] p-3 placeholder:text-xs placeholder:text-[#525F76] focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div className="mt-2 mb-8 flex items-center justify-end text-sm">
              <Link
                href={'/auth/forgot-password'}
                className="font-extrabold text-[#008647]"
              >
                Forgot Password?
              </Link>
            </div>
            <Link href="/auth/verify-email">
              <Button className="mt-1 mb-4 w-full rounded-md bg-[#008647] py-6 text-center">
                Log In
              </Button>
            </Link>
            <div className="flex items-center justify-center">
              <span className="text-xs text-[#5C5D6C]">
                Don&apos;t have an admin account?
              </span>
              <Link href={''} className="text-xs text-[#008647]">
                Create one
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
