'use client';

import { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface WorkflowCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
  isSubmitted?: boolean;
}

export default function WorkflowCard({
  icon,
  title,
  description,
  actionLabel,
  onClick,
  isSubmitted = false,
}: WorkflowCardProps) {
  return (
    <div className="flex flex-col items-start space-y-8 rounded-xl border border-[#D2DDF5] bg-white px-4 py-6">
      <div className="flex gap-4">
        <div className="mb-3 text-green-600">{icon}</div>
        <div>
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          <p className="mb-4 text-sm text-gray-500">{description}</p>
        </div>
      </div>
      {isSubmitted ? (
        <button
          disabled
          className="mt-auto flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-3 font-medium text-white opacity-75"
        >
          <CheckCircle2 size={18} />
          Submitted
        </button>
      ) : (
        <button
          onClick={onClick}
          className="mt-auto w-full rounded-md bg-[#008647] px-4 py-3 font-medium text-white hover:bg-green-700"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
