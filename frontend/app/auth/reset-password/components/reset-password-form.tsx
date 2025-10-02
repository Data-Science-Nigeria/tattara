'use client';

import { authControllerResetPasswordMutation } from '@/client/@tanstack/react-query.gen';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { PasswordInput } from '@/app/auth/components/password-input';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const resetPasswordMut = useMutation({
    ...authControllerResetPasswordMutation(),
  });

  const onSubmit = async (data: ResetPasswordData) => {
    setIsSubmitting(true);
    try {
      await resetPasswordMut.mutateAsync({
        body: {
          token: new URLSearchParams(window.location.search).get('token') || '',
          newPassword: data.password,
        },
      });
      toast.success('Password updated successfully.');
      router.push('/auth/password-reset-success');
    } catch (error) {
      setIsSubmitting(false);
      const errorMessage = getApiErrorMessage(error);
      toast.error(errorMessage);
      setError('password', {
        type: 'manual',
        message: errorMessage || 'Failed to update password. Please try again.',
      });
    }
  };

  return (
    <>
      <div className="mb-2 text-center">
        <h1 className="mb-2 text-2xl font-bold text-[#373844]">
          Reset Password
        </h1>
        <p className="text-sm text-[#5C5D6C]">
          Enter your new password to reset it
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <PasswordInput
            {...register('password')}
            error={errors.password?.message}
            label="New Password"
            placeholder="Enter your Password"
          />
        </div>

        <div>
          <PasswordInput
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            label="Confirm Password"
            placeholder="Confirm your password"
          />
        </div>

        <Button
          type="submit"
          className="mt-2 w-full rounded-md bg-[#008647] py-6 text-center"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            'Continue'
          )}
        </Button>
      </form>
    </>
  );
}