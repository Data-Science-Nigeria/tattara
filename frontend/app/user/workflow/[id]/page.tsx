'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { workflowControllerFindWorkflowByIdOptions } from '@/client/@tanstack/react-query.gen';
import TextRenderer from '../components/TextRenderer';
import AudioRenderer from '../components/AudioRenderer';
import ImageRenderer from '../components/ImageRenderer';

export default function WorkflowExecution() {
  const params = useParams();
  const workflowId = params.id as string;

  const { data: workflowData, isLoading } = useQuery({
    ...workflowControllerFindWorkflowByIdOptions({
      path: { workflowId },
    }),
    enabled: !!workflowId,
  });

  const workflow = (
    workflowData as {
      data?: { id: string; name: string; enabledModes?: string[] };
    }
  )?.data;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#008647]"></div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h2 className="mb-4 text-2xl font-semibold">Workflow Not Found</h2>
        <p className="mb-6 text-gray-600">
          The workflow you&apos;re looking for doesn&apos;t exist or you
          don&apos;t have access to it.
        </p>
        <button
          onClick={() => (window.location.href = '/user/overview')}
          className="rounded-lg bg-green-600 px-6 py-3 text-white transition hover:bg-green-700"
        >
          Back to Overview
        </button>
      </div>
    );
  }

  const renderWorkflowContent = () => {
    const enabledModes = workflow.enabledModes || [];

    if (enabledModes.includes('text')) {
      return (
        <TextRenderer
          workflow={{ ...workflow, type: 'text', workflowConfigurations: [] }}
        />
      );
    } else if (enabledModes.includes('audio')) {
      return (
        <AudioRenderer
          workflow={{ ...workflow, type: 'audio', workflowConfigurations: [] }}
        />
      );
    } else if (enabledModes.includes('image')) {
      return (
        <ImageRenderer
          workflow={{ ...workflow, type: 'image', workflowConfigurations: [] }}
        />
      );
    } else {
      return <div>Unsupported workflow type</div>;
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-4xl px-4">
        <button
          onClick={() => (window.location.href = '/user/overview')}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Back to Overview
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            {workflow.name}
          </h1>
          <p className="text-gray-600">Complete this workflow</p>
        </div>

        {renderWorkflowContent()}
      </div>
    </div>
  );
}
