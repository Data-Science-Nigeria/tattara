'use client';

interface StatsCardsProps {
  totalUsers: number;
}

export default function StatsCards({ totalUsers }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="relative rounded-lg bg-white p-4 shadow">
        <div className="absolute top-3 right-3 rounded-full bg-green-100 p-2">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Users</p>
          <h2 className="text-2xl font-semibold">{totalUsers}</h2>
          <p className="text-xs text-gray-400">
            All registered users under here
          </p>
        </div>
      </div>
    </div>
  );
}
