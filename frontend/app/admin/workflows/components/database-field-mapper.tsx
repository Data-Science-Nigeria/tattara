'use client';

import { useState, useEffect } from 'react';

interface DatabaseFieldMapperProps {
  field: {
    id: string;
    label?: string;
    fieldName?: string;
    fieldType: string;
    databaseMapping?: {
      column: string;
    };
  };
  onMapping: (mapping: { column: string }) => void;
}

export default function DatabaseFieldMapper({
  field,
  onMapping,
}: DatabaseFieldMapperProps) {
  const [manualColumn, setManualColumn] = useState(
    field.databaseMapping?.column || field.fieldName || field.label || ''
  );

  // Auto-map on mount if not already mapped
  useEffect(() => {
    if (!field.databaseMapping?.column && manualColumn) {
      onMapping({ column: manualColumn });
    }
  }, [field.databaseMapping?.column, manualColumn, onMapping]);

  const handleColumnChange = (column: string) => {
    setManualColumn(column);
    if (column.trim()) {
      onMapping({ column: column.trim() });
    }
  };

  return (
    <div className="rounded-lg border border-[#D2DDF5] bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-medium text-gray-900">
          {field.label || field.fieldName}
        </h4>
        <span className="rounded bg-gray-100 px-2 py-1 text-xs">
          {field.fieldType}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Column Name
          </label>
          <input
            type="text"
            value={manualColumn}
            onChange={(e) => handleColumnChange(e.target.value)}
            placeholder="Enter column name"
            className="w-full rounded-lg border border-[#D2DDF5] px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </div>

        {/* Current Mapping Display */}
        {field.databaseMapping && (
          <div className="mt-3 rounded bg-green-50 p-2 text-sm">
            <span className="text-green-700">
              Mapped to column: {field.databaseMapping.column}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
