'use client';

import { Users } from 'lucide-react';

interface StatsCardsProps {
  totalUsers: number;
  activeUsers: number;
}

export default function StatsCards({
  totalUsers,
  activeUsers,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="relative rounded-lg bg-white p-4 shadow">
        <div className="absolute top-3 right-3 rounded-full bg-green-100 p-2">
          <Users className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Users</p>
          <h2 className="text-2xl font-semibold">{totalUsers}</h2>
          <p className="text-xs text-gray-400">All registered users</p>
        </div>
      </div>

      <div className="relative rounded-lg bg-white p-4 shadow">
        <div className="absolute top-3 right-3 rounded-full bg-green-100 p-2">
          <Users className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">Active Users</p>
          <h2 className="text-2xl font-semibold">{activeUsers}</h2>
          <p className="text-xs text-gray-400">Verified users</p>
        </div>
      </div>
    </div>
  );
}
