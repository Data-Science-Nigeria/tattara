'use client';

import { ReactNode } from 'react';

interface WorkflowCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
}

export default function WorkflowCard({
  icon,
  title,
  description,
  actionLabel,
  onClick,
}: WorkflowCardProps) {
  return (
    <div className="flex flex-col items-start space-y-8 rounded-xl bg-white px-4 py-6 shadow-md">
      <div className="flex gap-4">
        <div className="mb-3 text-green-600">{icon}</div>
        <div>
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          <p className="mb-4 text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <button
        onClick={onClick}
        className="mt-auto w-full rounded-lg bg-[#008647] px-4 py-3 font-medium text-white hover:bg-green-700"
      >
        {actionLabel}
      </button>
    </div>
  );
}
