'use client';

import { useState } from 'react';
import { ChevronDown, Download, ArrowUp, ArrowDown } from 'lucide-react';
import SearchInput from './search-input';
import { exportToJSON, exportToCSV, exportToPDF } from '../utils/export-utils';

interface ProgramData {
  name: string;
  program: string;
  completedOn: string;
  status: string;
}

interface ProgramTableProps {
  data?: ProgramData[];
  isLoading?: boolean;
  programName?: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'Pending':
        return 'text-[#FD8822] bg-[#FFE2C9]';
      case 'Completed':
        return 'text-[#008647] bg-[#DCF5E9]';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusStyle()}`}
    >
      {status}
    </span>
  );
};

export default function ProgramTable({
  data = [],
  isLoading = false,
  programName = 'Program',
}: ProgramTableProps) {
  const [search, setSearch] = useState('');
  const [showLimit, setShowLimit] = useState(10);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const clearDate = () => {
    setSelectedDate('');
    setShowDatePicker(false);
  };

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
      const matchesSearch =
        item.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.program?.toLowerCase().includes(search.toLowerCase());

      const matchesDate = !selectedDate || item.completedOn === selectedDate;
      const matchesStatus = !statusFilter || item.status === statusFilter;

      return matchesSearch && matchesDate && matchesStatus;
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
          placeholder="Search by name or full name..."
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
                        ({ name, program, completedOn, status }) => ({
                          Name: name,
                          'Assigned Workflow': program,
                          'Completed on': completedOn,
                          Status: status,
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
                        ({ name, program, completedOn, status }) => ({
                          Name: name,
                          'Assigned Workflow': program,
                          'Completed on': completedOn,
                          Status: status,
                        })
                      );
                      exportToCSV(exportData, `${programName}.csv`, [
                        'Name',
                        'Assigned Workflow',
                        'Completed on',
                        'Status',
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
                        ({ name, program, completedOn, status }) => ({
                          Name: name,
                          'Assigned Workflow': program,
                          'Completed on': completedOn,
                          Status: status,
                        })
                      );
                      exportToPDF(
                        exportData,
                        `${programName}.pdf`,
                        `${programName} Report`,
                        ['Name', 'Assigned Workflow', 'Completed on', 'Status']
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
      <div className="rounded-md border bg-white">
        <table className="w-full">
          <thead className="bg-[#F2F3FF]">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-gray-700">
                <div className="flex items-center gap-2">
                  Name
                  <button
                    onClick={handleSort}
                    className="flex items-center hover:bg-gray-100 rounded p-1"
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
              <th className="px-6 py-4 text-left font-semibold text-gray-700">
                Assigned Workflow
              </th>
              <th className="px-6 py-4 text-left font-semibold text-gray-700">
                <div className="flex items-center gap-2">
                  Completed on
                  <div className="relative">
                    <svg
                      className="h-4 w-4 cursor-pointer"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      onClick={() => setShowDatePicker(!showDatePicker)}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>

                    {showDatePicker && (
                      <div className="absolute top-6 right-0 z-20 w-40 rounded border bg-white p-2 shadow-lg">
                        <input
                          type="date"
                          value={selectedDate}
                          max={getCurrentDate()}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="mb-1 w-full rounded border px-1 py-1 text-xs"
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={clearDate}
                            className="flex-1 rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </th>
              <th className="px-6 py-4 text-left font-semibold text-gray-700">
                <div className="flex items-center gap-2">
                  Status
                  <div className="relative">
                    <ChevronDown
                      className="h-4 w-4 cursor-pointer"
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    />
                    {showStatusDropdown && (
                      <div className="absolute top-6 right-0 z-20 w-32 rounded border bg-white shadow-lg">
                        <button
                          onClick={() => {
                            setStatusFilter('');
                            setShowStatusDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50"
                        >
                          All
                        </button>
                        <button
                          onClick={() => {
                            setStatusFilter('Pending');
                            setShowStatusDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50"
                        >
                          Pending
                        </button>
                        <button
                          onClick={() => {
                            setStatusFilter('Completed');
                            setShowStatusDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50"
                        >
                          Completed
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  <div className="flex items-center justify-center py-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#008647]"></div>
                    <span className="ml-2">Loading users...</span>
                  </div>
                </td>
              </tr>
            ) : currentData.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              currentData.map((item, index) => (
                <tr key={index} className="border-b" data-row={index}>
                  <td className="px-6 py-4 text-gray-700">
                    {item.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {item.program || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {item.completedOn || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    <StatusBadge status={item.status || 'Pending'} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          Next &gt;
        </button>
      </div>
    </div>
  );
}
