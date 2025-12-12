'use client';

import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface SubmissionStatsCardsProps {
  completedCount: number;
  failedCount: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  bgColor: string;
  iconColor: string;
}

const StatCard = ({
  icon,
  title,
  value,
  bgColor,
  iconColor,
}: StatCardProps) => (
  <div className="rounded-lg border border-gray-200 bg-white p-6">
    <div className="flex items-center gap-4">
      <div className={`rounded-lg ${bgColor} p-3`}>
        <div className={iconColor}>{icon}</div>
      </div>
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

export default function SubmissionStatsCards({
  completedCount,
  failedCount,
}: SubmissionStatsCardsProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <StatCard
        icon={<CheckCircle2 size={24} />}
        title="Completed"
        value={completedCount}
        bgColor="bg-green-50"
        iconColor="text-green-600"
      />
      <StatCard
        icon={<XCircle size={24} />}
        title="Failed"
        value={failedCount}
        bgColor="bg-red-50"
        iconColor="text-red-600"
      />
    </div>
  );
}
