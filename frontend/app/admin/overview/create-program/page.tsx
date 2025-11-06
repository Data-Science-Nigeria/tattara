'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { programControllerCreateMutation } from '@/client/@tanstack/react-query.gen';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { toast } from 'sonner';
import { DHIS2Modal } from './components/dhis2-modal';

const programSchema = z.object({
  name: z.string().min(1, 'Program name is required'),
  description: z.string().min(1, 'Description is required'),
});

type ProgramData = z.infer<typeof programSchema>;

export default function CreateProgramPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDHIS2Modal, setShowDHIS2Modal] = useState(false);
  const [programData, setProgramData] = useState<ProgramData | null>(null);
  const [buttonText] = useState('Next');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProgramData>({
    resolver: zodResolver(programSchema),
  });

  const createProgram = useMutation({
    ...programControllerCreateMutation(),
  });

  const onSubmit = async (data: ProgramData) => {
    setProgramData(data);
    setShowDHIS2Modal(true);
  };

  const handleDHIS2Confirm = async () => {
    if (!programData) return;

    setIsSubmitting(true);
    setShowDHIS2Modal(false);

    try {
      await createProgram.mutateAsync({
        body: programData,
      });

      await queryClient.refetchQueries({
        queryKey: [
          'programControllerFindAll',
          { query: { page: 1, limit: 6 } },
        ],
      });

      toast.success('Program created successfully!');
      router.push('/admin/overview');
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
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-[#008647] focus:ring-2 focus:ring-green-500 focus:outline-none"
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
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-[#008647] focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={() => router.push('/admin/overview')}
              className="rounded-lg border-2 border-green-800 bg-white px-6 py-2 font-medium text-green-800 transition-colors hover:bg-green-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-green-800 px-6 py-2 font-medium text-white transition-colors hover:bg-green-900"
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

      {/* DHIS2 Modal */}
      <DHIS2Modal
        isOpen={showDHIS2Modal}
        onClose={() => setShowDHIS2Modal(false)}
        onConfirm={handleDHIS2Confirm}
      />
    </div>
  );
}
