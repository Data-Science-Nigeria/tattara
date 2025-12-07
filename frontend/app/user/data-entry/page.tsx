'use client';

export default function DataEntry() {
  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-semibold text-gray-800">
          Data Entry
        </h1>
        <div className="rounded-lg border-l-4 border-[#008647] bg-green-50 p-4">
          <p className="text-sm text-gray-700">
            <span className="font-medium text-[#008647]">Get Started:</span>{' '}
            Select a workflow from the overview page to begin data collection
          </p>
        </div>
      </div>
    </div>
  );
}
