'use client';

interface WorkflowTabsProps {
  activeTab: 'assigned' | 'active';
  onTabChange: (tab: 'assigned' | 'active') => void;
}

export default function WorkflowTabs({
  activeTab,
  onTabChange,
}: WorkflowTabsProps) {
  const tabs = [
    { id: 'assigned' as const, label: 'Assigned' },
    { id: 'active' as const, label: 'Active' },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
