'use client';

import { TriangleAlert } from 'lucide-react';
import WorkflowCard from './components/workFlowCard';

import { useState } from 'react';
import UpdatePasswordModal from './components/update-password-modal';

interface Workflow {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
}

export default function Workflows() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const workflows: Workflow[] = [];

  const handleSavePassword = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="px-4 py-6 sm:px-4 lg:px-8">
      {/* Update Required Banner */}
      <div className="mb-6 flex flex-col gap-4 rounded-lg border border-[#D2DDF5] bg-[#F9FFFC] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3 sm:items-center">
          <TriangleAlert className="shrink-0" />
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              Update Required
            </h4>
            <p className="text-xs text-gray-600">
              Set a new password to protect your account and data.
            </p>
          </div>
        </div>
        <button
          className="w-full rounded-lg bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700 sm:w-auto sm:py-3"
          onClick={() => setIsModalOpen(true)}
        >
          Update Password
        </button>
      </div>

      {/* Workflows */}
      <h2 className="mb-4 text-xl font-semibold text-gray-800 sm:text-xl">
        Available Workflows
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
        {workflows.map((wf, idx) => (
          <WorkflowCard key={idx} {...wf} />
        ))}
      </div>
      <UpdatePasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePassword}
      />
    </div>
  );
}
