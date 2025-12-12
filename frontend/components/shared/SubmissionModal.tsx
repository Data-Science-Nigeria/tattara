'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Calendar, User } from 'lucide-react';
import Image from 'next/image';
import { collectorControllerGetSubmissionByIdOptions } from '@/client/@tanstack/react-query.gen';

interface SubmissionModalProps {
  submissionId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface SubmissionData {
  id: string;
  workflow?: {
    name?: string;
    description?: string;
  };
  status: string;
  submittedAt: string;
  user?: {
    firstName?: string;
    lastName?: string;
  };
  metadata?: {
    type?: string;
    [key: string]: unknown;
  };
  data: unknown;
}

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyle = () => {
    const lowerStatus = status.toLowerCase();
    if (['submitted', 'completed', 'synced'].includes(lowerStatus)) {
      return 'text-[#008647] bg-[#DCF5E9]';
    }
    if (['pending', 'draft'].includes(lowerStatus)) {
      return 'text-[#FD8822] bg-[#FFE2C9]';
    }
    if (lowerStatus === 'processing') {
      return 'text-[#0066CC] bg-[#E6F2FF]';
    }
    if (lowerStatus === 'failed') {
      return 'text-[#C42127] bg-[#FFD3D5]';
    }
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusStyle()}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const TypeIcon = ({ type }: { type?: string }) => {
  const iconClass = 'h-4 w-4';
  switch (type?.toLowerCase()) {
    case 'image':
      return (
        <Image
          src="/camera.svg"
          alt="Image"
          width={16}
          height={16}
          className={iconClass}
        />
      );
    case 'audio':
      return (
        <Image
          src="/microphone-2.svg"
          alt="Audio"
          width={16}
          height={16}
          className={iconClass}
        />
      );
    default:
      return (
        <Image
          src="/document-text.svg"
          alt="Text"
          width={16}
          height={16}
          className={iconClass}
        />
      );
  }
};

export default function SubmissionModal({
  submissionId,
  isOpen,
  onClose,
}: SubmissionModalProps) {
  const { data: submissionData, isLoading } = useQuery({
    ...collectorControllerGetSubmissionByIdOptions({
      path: { id: submissionId },
    }),
    enabled: isOpen && !!submissionId,
  });

  const submission = (submissionData as { data?: SubmissionData })?.data;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 max-h-[90vh] w-full max-w-4xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Submission Details
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="custom-scrollbar max-h-[calc(90vh-120px)] overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#008647]"></div>
              <span className="ml-3 text-gray-600">Loading submission...</span>
            </div>
          ) : submission ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Workflow Title
                    </label>
                    <p className="text-gray-900">
                      {submission.workflow?.name || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <p className="text-gray-600">
                      {submission.workflow?.description || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <StatusBadge status={submission.status} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Submitted By
                    </label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-900">
                        {submission.user
                          ? `${submission.user.firstName} ${submission.user.lastName}`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Type
                    </label>
                    <div className="flex items-center gap-2">
                      <TypeIcon type={submission.metadata?.type} />
                      <span className="text-gray-900 capitalize">
                        {submission.metadata?.type || 'Text'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Submitted At
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-900">
                        {formatDate(submission.submittedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submitted Data */}
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700">
                  Submitted Data
                </label>
                <div className="custom-scrollbar overflow-x-auto rounded-lg bg-gray-50 p-4">
                  <pre className="text-sm whitespace-pre-wrap text-gray-800">
                    {JSON.stringify(submission.data, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Metadata */}
              {submission.metadata &&
                Object.keys(submission.metadata).length > 0 && (
                  <div>
                    <label className="mb-3 block text-sm font-medium text-gray-700">
                      Metadata
                    </label>
                    <div className="custom-scrollbar overflow-x-auto rounded-lg bg-gray-50 p-4">
                      <pre className="text-sm whitespace-pre-wrap text-gray-800">
                        {JSON.stringify(submission.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500">Submission not found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
