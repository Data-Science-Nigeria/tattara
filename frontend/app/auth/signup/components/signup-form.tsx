'use client';

import { authControllerRegisterMutation } from '@/client/@tanstack/react-query.gen';
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

const signUpSchema = z
  .object({
    firstName: z
      .string()
      .max(15, 'First name must be at most 15 characters')
      .min(1, 'First name is required')
      .transform((val) => val.trim())
      .refine(
        (val) => val.length > 0,
        'First name cannot be empty after trimming'
      )
      .refine(
        (val) => /^[a-zA-Z]+$/.test(val),
        'Only letters allowed, no spaces'
      ),
    lastName: z
      .string()
      .max(15, 'Last name must be at most 15 characters')
      .min(1, 'Last name is required')
      .transform((val) => val.trim())
      .refine(
        (val) => val.length > 0,
        'Last name cannot be empty after trimming'
      )
      .refine(
        (val) => /^[a-zA-Z]+$/.test(val),
        'Only letters allowed, no spaces'
      ),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email')
      .transform((val) => val.toLowerCase()),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be at most 128 characters')
      .regex(/^\S*$/, 'No spaces allowed in password')
      .regex(/[A-Z]/, 'Must include at least one uppercase letter')
      .regex(/[a-z]/, 'Must include at least one lowercase letter')
      .regex(/[0-9]/, 'Must include at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    agreeToTerms: z
      .boolean()
      .refine((val) => val === true, 'Must agree to terms'),
    role: z.literal('admin').optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignUpData = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const { setAuth } = useAuthStore();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registerUser = useMutation({
    ...authControllerRegisterMutation(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpData) => {
    setIsSubmitting(true);
    try {
      const res = await registerUser.mutateAsync({
        body: {
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        },
      });

      setAuth({
        id: res.userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      router.push('/auth/verification-sent');
    } catch (error) {
      setIsSubmitting(false);
      const err = getApiErrorMessage(error);
      toast.error(err);
      setError('email', { message: err });
    }
  };

  return (
    <>
      <div className="mb-4 text-center">
        <h1 className="mb-2 text-2xl font-bold text-[#373844]">
          Create Admin Account
        </h1>
        <p className="text-sm text-[#5C5D6C]">
          Get started in just a few steps.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto w-full max-w-lg space-y-4 px-4 sm:max-w-xl sm:px-6 md:max-w-2xl lg:max-w-4xl lg:px-8 xl:max-w-5xl"
      >
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-600">
              First Name
            </label>
            <input
              type="text"
              {...register('firstName')}
              placeholder="Enter your First Name"
              className="mt-1 w-full rounded border bg-[#F2F3FF] p-2 placeholder:text-sm placeholder:text-[#525F76] focus:border-[#03390F] focus:ring-[#03390F] focus:outline-none"
            />
            {errors.firstName && (
              <p className="text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-600">
              Last Name
            </label>
            <input
              type="text"
              {...register('lastName')}
              placeholder="Enter your Last Name"
              className="mt-1 w-full rounded border bg-[#F2F3FF] p-2 placeholder:text-sm placeholder:text-[#525F76] focus:border-[#03390F] focus:ring-[#03390F] focus:outline-none"
            />
            {errors.lastName && (
              <p className="text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              {...register('email')}
              placeholder="Enter your Email Address"
              className="mt-1 w-full rounded border bg-[#F2F3FF] p-2 pr-10 placeholder:text-sm placeholder:text-[#525F76] focus:border-[#03390F] focus:ring-[#03390F] focus:outline-none"
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

        <div>
          <PasswordInput
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            label="Confirm Password"
            placeholder="Confirm your password"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register('agreeToTerms')}
            className="h-4 w-4 rounded border-gray-300 text-[#008647] focus:ring-[#008647]"
          />
          <label className="text-sm text-gray-600">
            By clicking Create account, I agree that I have read and accepted
            the{' '}
            <Link href="/terms" className="text-[#008647] underline">
              Terms of Use
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-[#008647] underline">
              Privacy Policy
            </Link>
          </label>
        </div>
        {errors.agreeToTerms && (
          <p className="text-sm text-red-600">{errors.agreeToTerms.message}</p>
        )}

        <input type="hidden" {...register('role')} value="admin" />

        <Button
          type="submit"
          className="mt-2 mb-2 w-full rounded-md bg-[#008647] py-4 text-center"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            'Create Account'
          )}
        </Button>

        <div className="flex flex-col items-center justify-center gap-1 text-center sm:flex-row sm:gap-2">
          <span className="text-xs text-[#5C5D6C]">
            Already have an account?
          </span>
          <Link href="/auth/login" className="text-xs text-[#008647]">
            Sign In
          </Link>
        </div>
      </form>
    </>
  );
}
