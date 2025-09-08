'use client';

import { FileText, Image, Mic, Pen } from 'lucide-react';
import WorkflowCard from './components/workFlowCard';
export default function Workflows() {
  const workflows = [
    {
      icon: <FileText className="h-6 w-6" />,
      title: 'Child Registration',
      description:
        'Capture essential details to create and manage a child’s health record.',
      actionLabel: 'Fill Form',
      onClick: () => alert('Fill Form clicked'),
    },
    {
      icon: <Image className="h-6 w-6" />,
      title: 'Child Registration',
      description:
        'Capture essential details to create and manage a child’s health record.',
      actionLabel: 'Upload Picture',
      onClick: () => alert('Upload Picture clicked'),
    },
    {
      icon: <Mic className="h-6 w-6" />,
      title: 'Child Registration',
      description:
        'Capture essential details to create and manage a child’s health record.',
      actionLabel: 'Upload Audio',
      onClick: () => alert('Upload Audio clicked'),
    },
    {
      icon: <Pen className="h-6 w-6" />,
      title: 'Child Registration',
      description:
        'Capture essential details to create and manage a child’s health record.',
      actionLabel: 'Write Text',
      onClick: () => alert('Write Text clicked'),
    },
  ];

  return (
    <div className="p-8">
      {/* Update Required Banner */}
      <div className="mb-6 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            ⚠️ Update Required
          </h4>
          <p className="text-xs text-gray-600">
            Set a new password to protect your account and data.
          </p>
        </div>
        <button className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700">
          Update Password
        </button>
      </div>

      {/* Workflows */}
      <h2 className="mb-4 text-xl font-semibold text-gray-800">
        Available Workflows
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workflows.map((wf, idx) => (
          <WorkflowCard key={idx} {...wf} />
        ))}
      </div>
    </div>
  );
}
