interface Connection {
  id: string;
  name: string;
  type: string;
}

interface DataItem {
  id: string;
  name?: string;
  displayName?: string;
}

interface ConfigurationPanelProps {
  connections: Connection[];
  preSelectedConnection: string;
  preSelectedType: string;
  preSelectedProgram: string;
  programs: DataItem[];
  datasets: DataItem[];
}

export default function ConfigurationPanel({
  connections,
  preSelectedConnection,
  preSelectedType,
  preSelectedProgram,
  programs,
  datasets,
}: ConfigurationPanelProps) {
  return (
    <div className="flex-shrink-0 space-y-4 lg:col-span-1">
      <div className="rounded-lg bg-gray-50 p-4">
        <h3 className="mb-4 font-medium text-gray-900">Configuration</h3>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            DHIS2 Connection
          </label>
          <div className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-gray-700">
            {connections.find((conn) => conn.id === preSelectedConnection)
              ?.name || 'Loading...'}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Type
          </label>
          <div className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-gray-700 capitalize">
            {preSelectedType || 'Loading...'}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {preSelectedType === 'dataset' ? 'Dataset' : 'Program'}
          </label>
          <div className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-gray-700">
            {(() => {
              const items = preSelectedType === 'dataset' ? datasets : programs;
              const selectedItem = items.find(
                (item) => item.id === preSelectedProgram
              );
              return (
                selectedItem?.displayName || selectedItem?.name || 'Loading...'
              );
            })()}
          </div>
        </div>

        <div className="rounded bg-blue-50 p-2 text-xs text-gray-500">
          💡 To change these settings, go back to the DHIS2 Configuration step
        </div>
      </div>
    </div>
  );
}
