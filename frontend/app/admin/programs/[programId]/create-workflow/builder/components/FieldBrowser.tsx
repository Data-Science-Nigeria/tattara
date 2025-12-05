import { Search } from 'lucide-react';
import FieldCard from './FieldCard';

interface DataElement {
  id: string;
  name: string;
  displayName?: string;
  valueType: string;
  description?: string;
  mandatory?: boolean;
}

interface FieldBrowserProps {
  dataElements: DataElement[];
  filteredElements: DataElement[];
  selectedFields: DataElement[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onFieldToggle: (field: DataElement) => void;
  onFieldClick: (field: DataElement) => void;
  preSelectedConnection: string;
  preSelectedType: string;
  preSelectedProgram: string;
}

export default function FieldBrowser({
  dataElements,
  filteredElements,
  selectedFields,
  searchTerm,
  onSearchChange,
  onFieldToggle,
  onFieldClick,
  preSelectedConnection,
  preSelectedType,
  preSelectedProgram,
}: FieldBrowserProps) {
  return (
    <div className="lg:col-span-3">
      <div className="rounded-lg bg-gray-50 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Available Fields</h3>
          <div className="flex items-center gap-3">
            {dataElements.length > 0 && (
              <button
                onClick={() => {
                  const unselectedFields = dataElements.filter(
                    (element) =>
                      !selectedFields.find((f) => f.id === element.id)
                  );
                  unselectedFields.forEach((field) => onFieldToggle(field));
                }}
                className="text-sm text-green-600 hover:text-green-700"
              >
                Add All
              </button>
            )}
            {dataElements.length > 0 && (
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search fields..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-green-500 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {preSelectedConnection && preSelectedType && preSelectedProgram ? (
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {filteredElements.map((element) => (
              <FieldCard
                key={element.id}
                field={element}
                isSelected={!!selectedFields.find((f) => f.id === element.id)}
                onToggle={onFieldToggle}
                onClick={onFieldClick}
              />
            ))}

            {filteredElements.length === 0 && dataElements.length > 0 && (
              <p className="py-8 text-center text-gray-500">
                No fields found matching your search.
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <p>
              Select a connection, type, and {preSelectedType || 'item'} to
              browse available fields
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
