'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { workflowControllerFindWorkflowByIdOptions } from '@/client/@tanstack/react-query.gen';
import EditWorkflowForm from '@/app/admin/programs/[programId]/create-workflow/unified-workflow/components/EditWorkflowForm';

export default function StandaloneWorkflowEdit() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.workflowId as string;

  const { data: workflowData, isLoading } = useQuery({
    ...workflowControllerFindWorkflowByIdOptions({
      path: { workflowId },
    }),
    enabled: !!workflowId,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!workflowData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Workflow not found
          </h2>
          <button
            onClick={() => router.push('/admin/workflows')}
            className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Back to Workflows
          </button>
        </div>
      </div>
    );
  }

  return (
    <EditWorkflowForm
      workflowId={workflowId}
      programId="" // Not needed for standalone edit
      existingWorkflow={workflowData}
      isStandalone={true}
    />
  );
}
