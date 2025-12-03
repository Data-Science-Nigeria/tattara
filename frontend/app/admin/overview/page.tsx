'use client';

import React, { useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import Link from 'next/link';
import { getIconForProgram } from '../components/getIconForProgram';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { programControllerGetProgramsOptions } from '@/client/@tanstack/react-query.gen';

interface Program {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  participants: string[];
  isActive: boolean;
  borderColor: string;
  href?: string;
}

interface ProgramCardProps {
  program: Program;
}

const Programs = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [search, setSearch] = useState('');

  const {
    data: programsData,
    isLoading,
    refetch,
  } = useQuery({
    ...programControllerGetProgramsOptions({
      query: { page: 1, limit: 1000000 },
    }),
  });

  // Listen for program operations
  React.useEffect(() => {
    const handleProgramOperation = () => {
      setShowLoadingOverlay(true);
      refetch(); // Manually refetch data
      setTimeout(() => {
        setShowLoadingOverlay(false);
      }, 1000);
    };

    window.addEventListener('programDeleted', handleProgramOperation);
    window.addEventListener('programUpdated', handleProgramOperation);

    return () => {
      window.removeEventListener('programDeleted', handleProgramOperation);
      window.removeEventListener('programUpdated', handleProgramOperation);
    };
  }, [refetch]);

  interface ApiProgram {
    id: string;
    name: string;
    description?: string;
    isActive?: boolean;
    users?: Array<{ firstName: string; lastName: string }>;
  }

  interface ApiResponse {
    success: boolean;
    data: {
      programs: ApiProgram[];
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    timestamp: string;
  }

  // Extract programs from API response
  const apiData = (programsData as unknown as ApiResponse)?.data;
  const programsArray = apiData?.programs || [];

  const allPrograms: Program[] = programsArray.map((program: ApiProgram) => ({
    id: program.id,
    name: program.name,
    description: program.description || 'No description available',
    icon: getIconForProgram(program.name || ''),
    participants:
      program.users?.map((user) => user.firstName + ' ' + user.lastName) || [],
    isActive: program.isActive || false,
    borderColor: 'border-gray-200',
    href: '/admin/overview/card',
  }));

  // Filter programs based on search
  const filteredPrograms = allPrograms.filter(
    (program) =>
      program.name.toLowerCase().includes(search.toLowerCase()) ||
      program.description.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate pagination
  const isSearching = search.trim() !== '';
  const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const programs = filteredPrograms.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const ProgramCard: React.FC<ProgramCardProps> = ({ program }) => {
    const IconComponent = program.icon;

    return (
      <Link href={`/admin/overview/card?id=${program.id}`}>
        <div
          className={`rounded-xl border-2 bg-white p-3 sm:p-4 ${program.borderColor} transition-all duration-300 hover:border-[#008647] hover:shadow-lg focus:border-[#008647] focus:outline-none`}
        >
          <div className="mb-2 flex items-start gap-2 sm:mb-3 sm:gap-3">
            <div
              className={`flex-shrink-0 rounded-lg p-2 ${program.isActive ? 'border-green-500 bg-green-100' : 'bg-gray-100'}`}
            >
              {program.isActive ? (
                <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
              ) : (
                <IconComponent className="h-4 w-4 text-gray-600 sm:h-5 sm:w-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="mb-1 text-base font-semibold break-words text-gray-800 sm:text-lg">
                {program.name}
              </h3>
              <p className="text-xs leading-relaxed break-words whitespace-break-spaces text-gray-600">
                {program.description}
              </p>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="relative min-h-screen p-3 sm:p-6">
      {showLoadingOverlay && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center rounded-lg bg-white p-6">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-[#008647]"></div>
            <p className="text-gray-600">Processing...</p>
          </div>
        </div>
      )}
      <div className="w-full">
        <div className="mb-6 flex flex-col gap-4 px-0 sm:mb-8 sm:px-2">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-800 sm:text-2xl lg:text-4xl">
              Programs
            </h1>

            {/* Desktop button */}
            <Link href="/admin/overview/create-program" className="ml-auto">
              <button className="hidden items-center gap-2 rounded-lg bg-green-600 px-6 py-4 font-medium text-white transition-colors duration-200 hover:bg-green-700 lg:flex">
                Create Program
              </button>
            </Link>

            {/* Mobile/Tablet icon with tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/admin/overview/create-program"
                  className="ml-auto lg:hidden"
                >
                  <button className="flex items-center justify-center rounded-lg bg-green-600 p-3 text-white transition-colors duration-200 hover:bg-green-700">
                    <Plus className="h-4 w-4" />
                  </button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="left" className="bg-gray-900 text-white">
                <p>Create Program</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search programs..."
              className="w-full rounded-lg border border-gray-300 py-2 pr-10 pl-10 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {isSearching && (
            <p className="text-sm text-gray-600">
              Found {filteredPrograms.length} program
              {filteredPrograms.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#008647]"></div>
          </div>
        ) : programs.length > 0 ? (
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            {programs.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="mb-4 text-gray-500">No programs found</p>
          </div>
        )}

        {/* Pagination */}
        {programs.length > 0 && (
          <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded border border-gray-300 px-2 py-1"
              >
                <option value={6}>6</option>
                <option value={10}>10</option>
              </select>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Programs;
