import { Plus, Minus } from 'lucide-react';

interface DataElement {
  id: string;
  name: string;
  displayName?: string;
  valueType: string;
  description?: string;
  mandatory?: boolean;
}

interface FieldCardProps {
  field: DataElement;
  isSelected: boolean;
  onToggle: (field: DataElement) => void;
  onClick: (field: DataElement) => void;
}

const getValueTypeColor = (valueType: string) => {
  const colors = {
    TEXT: 'bg-blue-100 text-blue-800',
    NUMBER: 'bg-green-100 text-green-800',
    INTEGER: 'bg-green-100 text-green-800',
    DATE: 'bg-purple-100 text-purple-800',
    BOOLEAN: 'bg-orange-100 text-orange-800',
    TRUE_ONLY: 'bg-orange-100 text-orange-800',
  };
  return (
    colors[valueType as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  );
};

export default function FieldCard({
  field,
  isSelected,
  onToggle,
  onClick,
}: FieldCardProps) {
  return (
    <div
      className="cursor-pointer rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50"
      onClick={() => onClick(field)}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-medium text-gray-900">{field.name}</h4>
          <p className="truncate text-sm text-gray-500">ID: {field.id}</p>
          {field.description && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-600">
              {field.description}
            </p>
          )}
        </div>
        <div className="ml-3 flex items-center gap-2">
          {field.mandatory && (
            <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-800">
              Required
            </span>
          )}
          <span
            className={`rounded px-2 py-1 text-xs ${getValueTypeColor(field.valueType)}`}
          >
            {field.valueType}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(field);
            }}
            className={`rounded p-1 ${
              isSelected
                ? 'text-red-600 hover:bg-red-100'
                : 'text-green-600 hover:bg-green-100'
            }`}
          >
            {isSelected ? (
              <Minus className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
