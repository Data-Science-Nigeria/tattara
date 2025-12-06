'use client';

import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { workflowControllerFindWorkflowByIdOptions } from '@/client/@tanstack/react-query.gen';
import TextAiReview from '../components/TextAiReview';
import AudioAiReview from '../components/AudioAiReview';
import ImageAiReview from '../components/ImageAiReview';

export default function ManualTestPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const programId = params.programId as string;
  const workflowId = searchParams.get('workflowId');
  const inputType = searchParams.get('inputType') || 'text';

  const { data: workflowData, isLoading } = useQuery({
    ...workflowControllerFindWorkflowByIdOptions({
      path: { workflowId: workflowId || '' },
    }),
    enabled: !!workflowId,
  });

  const workflow = (workflowData as { data?: Record<string, unknown> })?.data;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">Workflow not found</p>
      </div>
    );
  }

  const renderTestComponent = () => {
    const testProps = {
      workflowId: workflowId!,
      onReviewComplete: () => {
        // No automatic redirect - user decides when to leave
      },
      onAiTestStatusChange: () => {
        // Handle status change if needed
      },
    };

    switch (inputType) {
      case 'text':
        return <TextAiReview {...testProps} />;
      case 'audio':
        return <AudioAiReview {...testProps} />;
      case 'image':
        return <ImageAiReview {...testProps} />;
      default:
        return <TextAiReview {...testProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Test Manual Workflow
          </h1>
          <p className="mt-2 text-gray-600">
            Test your manual workflow with AI processing
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 lg:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {workflow.name as string}
            </h2>
            <p className="text-sm text-gray-600">
              {workflow.description as string}
            </p>
          </div>

          {renderTestComponent()}

          <div className="mt-8 flex justify-end">
            <button
              onClick={() =>
                router.push(`/admin/programs/${programId}/create-workflow`)
              }
              className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
