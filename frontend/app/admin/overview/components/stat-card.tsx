import React from 'react';

export interface Stat {
  title: string;
  description: string;
  value: number;
  icon: string | React.ComponentType<{ className?: string }>;
}
export const StatsCard: React.FC<{ stat: Stat }> = ({ stat }) => {
  const IconComponent = stat.icon;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="mb-1 text-lg font-semibold text-gray-800">
            {stat.title}
          </h3>
          <p className="text-sm text-gray-600">{stat.description}</p>
        </div>
        <div className={`rounded-xl p-3 ${
          stat.title === 'Completed Workflows' ? 'bg-[#DCF5E9]' : 
          stat.title === 'Active Users' ? 'bg-[#DCF5E9]' : ''
        }`}>
          {typeof IconComponent === 'string' ? (
            <img src={IconComponent} />
          ) : (
            <IconComponent className={`h-6 w-6 ${
              stat.title === 'Completed Workflows' || stat.title === 'Active Users' ? 'text-[#008647]' : 'text-gray-600'
            }`} />
          )}
        </div>
      </div>
      <div className="text-4xl font-bold text-gray-900">{stat.value}</div>
    </div>
  );
};
