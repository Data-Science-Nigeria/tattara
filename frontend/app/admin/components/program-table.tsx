'use client';

import { useState } from 'react';
import {
  ChevronDown,
  Download,
  ArrowUp,
  ArrowDown,
  UserMinus,
} from 'lucide-react';
import SearchInput from './search-input';
import { exportToJSON, exportToCSV, exportToPDF } from '../utils/export-utils';

interface ProgramData {
  name: string;
  totalWorkflows: number;
  userId?: string;
}

interface ProgramTableProps {
  data?: ProgramData[];
  isLoading?: boolean;
  programName?: string;
  onUnassign?: (userId: string, userName: string) => void;
}

export default function ProgramTable({
  data = [],
  isLoading = false,
  programName = 'Program',
  onUnassign,
}: ProgramTableProps) {
  const [search, setSearch] = useState('');
  const [showLimit, setShowLimit] = useState(10);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

  const handleSort = () => {
    if (sortOrder === null) {
      setSortOrder('asc');
    } else if (sortOrder === 'asc') {
      setSortOrder('desc');
    } else {
      setSortOrder(null);
    }
  };

  const filteredData = data
    .filter((item) => {
      const matchesSearch = item.name
        ?.toLowerCase()
        .includes(search.toLowerCase());

      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortOrder === null) return 0;
      const comparison = a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const totalPages = Math.ceil(filteredData.length / showLimit);
  const startIndex = (currentPage - 1) * showLimit;
  const endIndex = startIndex + showLimit;
  const currentData = filteredData.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <SearchInput
          placeholder="Search by name..."
          value={search}
          onChange={setSearch}
        />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[#A4B1CA]">
            <span>Showing:</span>
            <div className="relative gap-2 rounded-md border border-[#BAC7DF] bg-white px-2 py-2 text-black">
              <select
                value={showLimit}
                onChange={(e) => setShowLimit(Number(e.target.value))}
                className="bg-transparent outline-none"
              >
                {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 transform" />
            </div>
          </div>
        </div>
        <div className="flex flex-row gap-4">
          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="flex items-center gap-2 rounded-md border border-[#BAC7DF] bg-[#DBDCEA] px-3 py-3 text-sm text-[#65738B]"
            >
              <Download size={18} />
              Export
              <ChevronDown size={18} />
            </button>

            {showExportDropdown && (
              <div className="absolute right-0 z-10 mt-2 w-full rounded-lg border bg-white shadow-lg">
                <div>
                  <button
                    onClick={() => {
                      const exportData = filteredData.map(
                        ({ name, totalWorkflows }) => ({
                          Name: name,
                          'Total Assigned Workflows': totalWorkflows,
                        })
                      );
                      exportToJSON(exportData, `${programName}.json`);
                      setShowExportDropdown(false);
                    }}
                    className="w-full rounded-t-lg px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => {
                      const exportData = filteredData.map(
                        ({ name, totalWorkflows }) => ({
                          Name: name,
                          'Total Assigned Workflows': totalWorkflows,
                        })
                      );
                      exportToCSV(exportData, `${programName}.csv`, [
                        'Name',
                        'Total Assigned Workflows',
                      ]);
                      setShowExportDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => {
                      const exportData = filteredData.map(
                        ({ name, totalWorkflows }) => ({
                          Name: name,
                          'Total Assigned Workflows': totalWorkflows,
                        })
                      );
                      exportToPDF(
                        exportData,
                        `${programName}.pdf`,
                        `${programName} Report`,
                        ['Name', 'Total Assigned Workflows']
                      );
                      setShowExportDropdown(false);
                    }}
                    className="w-full rounded-b-lg px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="custom-scrollbar overflow-x-auto rounded-md border bg-white">
        <table className="relative w-full min-w-[700px]">
          <thead className="bg-[#F2F3FF]">
            <tr>
              <th className="px-3 py-4 text-left font-semibold text-gray-700 sm:px-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base">Name</span>
                  <button
                    onClick={handleSort}
                    className="flex items-center rounded p-1 hover:bg-gray-100"
                  >
                    <ArrowUp
                      size={14}
                      className={`${sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'}`}
                    />
                    <ArrowDown
                      size={14}
                      className={`${sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'} -ml-1`}
                    />
                  </button>
                </div>
              </th>
              <th className="px-3 py-4 text-left font-semibold text-gray-700 sm:px-6">
                <span className="text-sm sm:text-base">
                  Total Assigned Workflows
                </span>
              </th>
              <th className="sticky right-0 border-l bg-[#F2F3FF] px-3 py-4 text-left font-semibold text-gray-700 sm:px-6">
                <span className="text-sm sm:text-base">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-4 text-center text-gray-500 sm:px-6"
                >
                  <div className="flex items-center justify-center py-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#008647]"></div>
                    <span className="ml-2 text-sm">Loading users...</span>
                  </div>
                </td>
              </tr>
            ) : currentData.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-4 text-center text-sm text-gray-500 sm:px-6"
                >
                  No users found
                </td>
              </tr>
            ) : (
              currentData.map((item, index) => (
                <tr key={index} className="border-b" data-row={index}>
                  <td className="px-3 py-4 text-sm text-gray-700 sm:px-6">
                    {item.name || 'N/A'}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-700 sm:px-6">
                    {item.totalWorkflows || 0}
                  </td>
                  <td className="sticky right-0 border-l bg-white px-3 py-4 sm:px-6">
                    <button
                      onClick={() => onUnassign?.(item.userId || '', item.name)}
                      className="flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-600 transition-colors hover:bg-red-100"
                      disabled={!item.userId}
                    >
                      <UserMinus size={14} />
                      Unassign
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredData.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            &lt; Previous
          </button>

          {getPageNumbers().map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`h-8 w-8 rounded border text-sm ${
                currentPage === page
                  ? 'border-[#008647] bg-[#008647] text-white'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            Next &gt;
          </button>
        </div>
      )}
    </div>
  );
}
