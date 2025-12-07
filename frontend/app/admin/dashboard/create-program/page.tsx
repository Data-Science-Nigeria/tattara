'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  programControllerCreateMutation,
  programControllerGetProgramsOptions,
} from '@/client/@tanstack/react-query.gen';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { toast } from 'sonner';

const validateTextContent = (text: string): boolean => {
  const textChars = text.replace(/[^a-zA-Z]/g, '').length;
  const numberChars = text.replace(/[^0-9]/g, '').length;
  return textChars > numberChars;
};

const programSchema = z.object({
  name: z
    .string()
    .min(8, 'Program name must be at least 8 characters')
    .refine(validateTextContent, 'Name cannot contain only numbers'),
  description: z
    .string()
    .min(15, 'Description must be at least 15 characters')
    .refine(validateTextContent, 'Description cannot contain only numbers'),
});

type ProgramData = z.infer<typeof programSchema>;

export default function CreateProgramPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [buttonText] = useState('Create Program');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProgramData>({
    resolver: zodResolver(programSchema),
  });

  const createProgram = useMutation({
    ...programControllerCreateMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: programControllerGetProgramsOptions().queryKey,
      });
      toast.success('Program created successfully!');
      router.push('/admin/dashboard');
    },
  });

  const onSubmit = async (data: ProgramData) => {
    setIsSubmitting(true);

    try {
      await createProgram.mutateAsync({
        body: data,
      });
    } catch (error) {
      const err = getApiErrorMessage(error);
      toast.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-8">
      {/* Back Button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft size={20} />
          Back
        </Button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Create Program</h1>
      </div>

      {/* Form */}
      <div className="max-w-4xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Program Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Program Name
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="Enter program name"
              className="w-full rounded-lg border border-[#D2DDF5] bg-white px-3 py-2 focus:border-[#008647] focus:ring-2 focus:ring-green-500 focus:outline-none"
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              {...register('description')}
              placeholder="Enter program description"
              rows={4}
              className="w-full rounded-lg border border-[#D2DDF5] bg-white px-3 py-2 focus:border-[#008647] focus:ring-2 focus:ring-green-500 focus:outline-none"
              required
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              type="button"
              onClick={() => router.push('/admin/dashboard')}
              className="w-full rounded-lg border-2 border-green-800 bg-white px-4 py-2 font-medium text-green-800 transition-colors hover:bg-green-800 hover:text-white sm:w-auto sm:px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-green-800 px-4 py-2 font-medium text-white transition-colors hover:bg-green-900 sm:w-auto sm:px-6"
            >
              {isSubmitting ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                buttonText
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
