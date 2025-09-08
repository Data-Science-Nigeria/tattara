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
    <div className="flex flex-col items-start rounded-xl bg-white p-6 shadow-md">
      <div className="mb-3 text-green-600">{icon}</div>
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      <p className="mb-4 text-sm text-gray-500">{description}</p>
      <button
        onClick={onClick}
        className="mt-auto rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
      >
        {actionLabel}
      </button>
    </div>
  );
}
