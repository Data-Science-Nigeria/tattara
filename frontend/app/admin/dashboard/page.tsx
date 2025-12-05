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

const Dashboard = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(
    null
  );
  const [hoveredProgramId, setHoveredProgramId] = useState<string | null>(null);

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
    icon: getIconForProgram(),
    participants:
      program.users?.map((user) => user.firstName + ' ' + user.lastName) || [],
    isActive: program.isActive || false,
    borderColor: 'border-[#D2DDF5]',
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
    const isSelected = selectedProgramId === program.id;
    const isHovered = hoveredProgramId === program.id;
    const showRadio = isSelected || isHovered;

    return (
      <Link href={`/admin/programs/${program.id}/overview`}>
        <div
          onClick={() => setSelectedProgramId(program.id)}
          onMouseEnter={() => setHoveredProgramId(program.id)}
          onMouseLeave={() => setHoveredProgramId(null)}
          className={`rounded-xl border-2 bg-white p-3 transition-all duration-300 hover:border-green-600 focus:border-green-600 focus:outline-none sm:p-4 ${
            showRadio ? 'border-green-600' : program.borderColor
          }`}
        >
          <div className="mb-2 flex items-start gap-2 sm:mb-3 sm:gap-3">
            <div className="flex-shrink-0 rounded-lg bg-white p-2">
              {showRadio ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-green-600 bg-green-600 sm:h-7 sm:w-7">
                  <div className="h-2 w-2 rounded-full bg-white"></div>
                </div>
              ) : program.isActive ? (
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              ) : (
                <IconComponent className="h-6 w-6 text-gray-600 sm:h-7 sm:w-7" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="mb-1 text-lg font-semibold break-words text-gray-800 sm:text-xl">
                {program.name}
              </h3>
              <p className="mb-2 text-xs leading-relaxed break-words whitespace-break-spaces text-gray-600">
                {program.description}
              </p>
              <div className="flex items-center gap-3">
                <img
                  src="/Frame 250.svg"
                  alt="Users"
                  className="h-[35px] w-[75px]"
                />
                <span
                  className="text-sm font-normal"
                  style={{ color: '#999AAA' }}
                >
                  {program.participants.length === 0 ? (
                    'No users assigned'
                  ) : program.participants.length === 1 ? (
                    <>
                      {program.participants[0].length > 15
                        ? program.participants[0].substring(0, 15) + '...'
                        : program.participants[0]}{' '}
                      is in this program
                    </>
                  ) : program.participants.length === 2 ? (
                    <>
                      {program.participants[0].length > 12
                        ? program.participants[0].substring(0, 12) + '...'
                        : program.participants[0]}
                      ,{' '}
                      {program.participants[1].length > 12
                        ? program.participants[1].substring(0, 12) + '...'
                        : program.participants[1]}{' '}
                      are in this program
                    </>
                  ) : (
                    <>
                      {program.participants[0].length > 10
                        ? program.participants[0].substring(0, 10) + '...'
                        : program.participants[0]}
                      ,{' '}
                      {program.participants[1].length > 10
                        ? program.participants[1].substring(0, 10) + '...'
                        : program.participants[1]}{' '}
                      + {program.participants.length - 2} are in this program
                    </>
                  )}
                </span>
              </div>
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
            <Link href="/admin/dashboard/create-program" className="ml-auto">
              <button className="hidden items-center gap-2 rounded-lg bg-green-600 px-6 py-4 font-medium text-white transition-colors duration-200 hover:bg-green-700 lg:flex">
                Create Program
              </button>
            </Link>

            {/* Mobile/Tablet icon with tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/admin/dashboard/create-program"
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
          {allPrograms.length >= 10 && (
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
          )}

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
            {filteredPrograms.length >= 10 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded border border-gray-300 px-2 py-1"
                >
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                </select>
              </div>
            )}

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

export default Dashboard;
