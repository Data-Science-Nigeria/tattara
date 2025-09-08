export interface Stat {
  title: string;
  description: string;
  value: number;
  icon: string;
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
        <div className={`rounded-xl p-3`}>
          <img src={IconComponent} />
        </div>
      </div>
      <div className="text-4xl font-bold text-gray-900">{stat.value}</div>
    </div>
  );
};
