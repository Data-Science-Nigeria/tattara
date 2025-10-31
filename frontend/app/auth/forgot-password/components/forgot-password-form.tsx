'use client';

import { authControllerForgotPasswordMutation } from '@/client/@tanstack/react-query.gen';
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

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const forgotPasswordMutation = useMutation({
    ...authControllerForgotPasswordMutation(),
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    setIsSubmitting(true);
    try {
      await forgotPasswordMutation.mutateAsync({
        body: { email: data.email },
      });
      toast.success('Reset link sent to your email.');
      router.push('/auth/reset-email-sent');
    } catch (error: unknown) {
      setIsSubmitting(false);
      if (
        (error as { error_code?: string })?.error_code === 'invalid_credentials'
      ) {
        setError('email', {
          type: 'manual',
          message: 'Email not found',
        });
      } else {
        const errorMessage = getApiErrorMessage(error);
        toast.error(`Failed to send reset link: ${errorMessage}`);
      }
    }
  };

  return (
    <>
      <div className="mb-4 text-center">
        <h1 className="mb-2 text-2xl font-bold text-[#373844]">
          Forgot Password
        </h1>
        <p className="text-sm text-[#5C5D6C]">
          Enter your registered email to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              {...register('email')}
              placeholder="Enter your Email Address"
              className="mt-1 w-full rounded border border-[#DBDCEA] bg-[#F2F3FF] p-3 pr-12 placeholder:text-xs placeholder:text-[#525F76] focus:border-green-500 focus:ring-green-500"
            />
            <img
              src={'/sms.svg'}
              alt="mail-icon"
              className="absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 transform"
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="mt-2 mb-2 w-full rounded-md bg-[#008647] py-6 text-center"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            'Reset Password'
          )}
        </Button>

        <div className="flex flex-col items-center justify-center gap-1 text-center sm:flex-row sm:gap-2">
          <span className="text-xs text-[#5C5D6C]">Just remembered?</span>
          <Link href="/auth/login" className="text-xs text-[#008647]">
            Login
          </Link>
        </div>
      </form>
    </>
  );
}
