'use client';

import { authControllerLoginMutation } from '@/client/@tanstack/react-query.gen';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { PasswordInput } from '@/app/auth/components/password-input';
import { useAuthStore } from '@/app/store/use-auth-store';

const signInSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type SignInData = z.infer<typeof signInSchema>;

export function LoginForm() {
  const { setAuth } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
  });

  const login = useMutation({
    ...authControllerLoginMutation(),
  });

  const onSubmit = async (data: SignInData) => {
    setIsSubmitting(true);
    try {
      const res = await login.mutateAsync({
        body: data,
      });

      const userData = res as any;
      
      // Check if email is verified
      if (userData?.user?.isEmailVerified === false) {
        setAuth({
          email: data.email,
          id: userData?.user?.id,
          isEmailVerified: false,
          createdAt: userData?.user?.createdAt,
        });
        router.push('/auth/verify-email');
        setIsSubmitting(false);
        return;
      }

      // Set auth data
      setAuth({
        email: userData?.user?.email || data.email,
        id: userData?.user?.id,
        isEmailVerified: userData?.user?.isEmailVerified,
        createdAt: userData?.user?.createdAt,
        token: userData?.accessToken,
        firstName: userData?.user?.firstName,
        lastName: userData?.user?.lastName,
        roles: userData?.user?.roles,
        permissions: userData?.user?.permissions,
      });

      // Role-based routing
      const userRoles = userData?.user?.roles || [];
      const hasAdminRole = userRoles.some((role: any) => 
        role.name === 'admin' || role === 'admin'
      );

      if (hasAdminRole) {
        router.push('/admin/overview');
      } else {
        router.push('/user/overview');
      }
    } catch (error) {
      setIsSubmitting(false);
      const err = getApiErrorMessage(error);

      if (
        err.toLowerCase().includes('verify') ||
        err.toLowerCase().includes('verification') ||
        err.toLowerCase().includes('not verified')
      ) {
        setAuth({
          email: data.email,
          id: null,
          isEmailVerified: false,
          createdAt: null,
        });
        router.push('/auth/verify-email');
        return;
      }

      toast.error(err);
      setError('email', { message: err });
    }
  };

  return (
    <>
      <div className="mb-4 text-center">
        <h1 className="mb-2 text-2xl font-bold text-[#373844]">
          Log Into Your Account
        </h1>
        <p className="text-sm text-[#5C5D6C]">
          Enter your details to access your account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:px-6 lg:px-8">
        <div>
          <label className="block text-sm font-medium text-gray-600">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              {...register('email')}
              placeholder="Enter your Email Address"
              className="mt-1 w-full rounded border p-2 pr-10 bg-[#F2F3FF] placeholder:text-sm placeholder:text-[#525F76] focus:border-[#03390F] focus:ring-[#03390F] focus:outline-none"
            />
            <img
              src={'/sms.svg'}
              alt="mail-icon"
              className="absolute top-1/2 right-2 h-5 w-5 -translate-y-1/2 transform"
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <PasswordInput
            {...register('password')}
            error={errors.password?.message}
            label="Password"
            placeholder="Enter your Password"
          />
        </div>

        <div className="flex items-center justify-end text-sm">
          <Link
            href="/auth/forgot-password"
            className="font-extrabold text-[#008647]"
          >
            Forgot Password?
          </Link>
        </div>

        <Button
          type="submit"
          className="mt-2 mb-2 w-full rounded-md bg-[#008647] py-4 text-center"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            'Log In'
          )}
        </Button>
      </form>
    </>
  );
}