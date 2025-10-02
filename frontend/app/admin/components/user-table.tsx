'use client';

import { useState } from 'react';
import { ChevronDown, Download, Edit, UserX, Trash2, MoreHorizontal, Plus } from 'lucide-react';
import SearchInput from './search-input';

interface UserTableProps {
  data?: any[];
}

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'Pending':
        return 'text-[#FD8822] bg-[#FFE2C9]';
      case 'Active':
        return 'text-[#008647] bg-[#DCF5E9]';
      case 'Suspended':
        return 'text-[#C42127] bg-[#FFD3D5]';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle()}`}>
      {status}
    </span>
  );
};

export default function UserTable({ data = [] }: UserTableProps) {
  const [search, setSearch] = useState('');
  const [showLimit, setShowLimit] = useState(10);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, right: 0 });

  const handleDropdownClick = (index: number, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setDropdownCoords({
      top: rect.top - 140,
      right: window.innerWidth - rect.right
    });
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const clearDate = () => {
    setSelectedDate('');
    setShowDatePicker(false);
  };

  const filteredData = data.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.email?.toLowerCase().includes(search.toLowerCase());
    
    const matchesDate = !selectedDate || item.createdBy === selectedDate;
    
    return matchesSearch && matchesDate;
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
          placeholder="Search by name, full name or email..."
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
                {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(num => (
                  <option key={num} value={num}>{num}</option>
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
              <div className="absolute right-0 mt-2 w-full bg-white rounded-lg shadow-lg border z-10">
                <div>
                  <button className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm rounded-t-lg">JSON</button>
                  <button className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm">CSV</button>
                  <button className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm rounded-b-lg">PDF</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white overflow-x-auto">
        <table className="w-full">
            <thead className="bg-[#F2F3FF]">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Name</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Email</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    Status
                    <ChevronDown className="w-4 h-4 cursor-pointer" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    Created By
                    <div className="relative">
                      <svg 
                        className="w-4 h-4 cursor-pointer" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        onClick={() => setShowDatePicker(!showDatePicker)}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      
                      {showDatePicker && (
                        <div className="absolute top-6 right-0 bg-white border rounded shadow-lg p-2 z-20 w-40">
                          <input
                            type="date"
                            value={selectedDate}
                            max={getCurrentDate()}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="mb-1 px-1 py-1 border rounded text-xs w-full"
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={clearDate}
                              className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 flex-1"
                            >
                              Clear
                            </button>
                            <button
                              onClick={() => setShowDatePicker(false)}
                              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex-1"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="px-6 py-4 text-gray-700">{item.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-gray-700">{item.email || 'N/A'}</td>
                  <td className="px-6 py-4 text-gray-700">
                    <StatusBadge status={item.status || 'Active'} />
                  </td>
                  <td className="px-6 py-4 text-gray-700">{item.createdBy || 'N/A'}</td>
                  <td className="px-6 py-4 text-gray-700 relative">
                    <div className="relative">
                      <button
                        onClick={(e) => handleDropdownClick(index, e)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      
                      {activeDropdown === index && (
                        <div 
                          className="fixed w-48 bg-white rounded-lg shadow-lg border z-50"
                          style={{
                            top: `${dropdownCoords.top}px`,
                            right: `${dropdownCoords.right}px`
                          }}
                        >
                          <div>
                            <button 
                              onClick={() => window.location.href = '/admin/create-workflow/select-form'}
                              className="w-full px-3 py-2 text-left flex items-center gap-2 text-gray-600 hover:bg-green-600 hover:text-white rounded-t-lg"
                            >
                              <Plus className="w-4 h-4" />
                              Create Workflow
                            </button>
                            <button className="w-full px-3 py-2 text-left flex items-center gap-2 bg-green-600 text-white hover:bg-green-700">
                              <Edit className="w-4 h-4" />
                              Edit user
                            </button>
                            <button className="w-full px-3 py-2 text-left flex items-center gap-2 text-gray-600 hover:bg-green-600 hover:text-white">
                              <UserX className="w-4 h-4" />
                              Suspend user
                            </button>
                            <button className="w-full px-3 py-2 text-left flex items-center gap-2 text-red-600 hover:bg-red-600 hover:text-white rounded-b-lg">
                              <Trash2 className="w-4 h-4" />
                              Delete user
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
            className={`w-8 h-8 text-sm border rounded ${
              currentPage === page
                ? 'bg-[#008647] text-white border-[#008647]'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
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