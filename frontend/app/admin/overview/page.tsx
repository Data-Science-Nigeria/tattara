'use client';

import React, { useState } from 'react';
import {
  FileText,
  Users,
  ClipboardList,
  FolderPlus,
  Heart,
  Shield,
  Activity,
  Baby,
  Stethoscope,
  Pill,
  Eye,
  Brain,
} from 'lucide-react';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { programControllerFindAllOptions } from '@/client/@tanstack/react-query.gen';

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

  // Listen for program operations
  React.useEffect(() => {
    const handleProgramOperation = () => {
      setShowLoadingOverlay(true);
      setTimeout(() => {
        setShowLoadingOverlay(false);
      }, 5000);
    };

    window.addEventListener('programDeleted', handleProgramOperation);
    window.addEventListener('programUpdated', handleProgramOperation);

    return () => {
      window.removeEventListener('programDeleted', handleProgramOperation);
      window.removeEventListener('programUpdated', handleProgramOperation);
    };
  }, []);

  const { data: programsData, isLoading } = useQuery({
    ...programControllerFindAllOptions({
      query: { page: currentPage, limit: itemsPerPage },
    }),
    refetchInterval: 3000, // Auto-refresh every 3 seconds
  });

  interface ApiProgram {
    id: string;
    name: string;
    description?: string;
    isActive?: boolean;
    users?: Array<{ firstName: string; lastName: string }>;
  }

  interface ApiResponse {
    data?: {
      programs?: ApiProgram[];
      pagination?: { total: number; pages: number };
    };
  }

  // Extract programs and pagination from API response
  const programsArray = (programsData as ApiResponse)?.data?.programs || [];
  const pagination = (programsData as ApiResponse)?.data?.pagination || {
    total: 0,
    pages: 1,
  };

  const getIconForProgram = (programName: string) => {
    const name = programName.toLowerCase();
    if (name.includes('child') || name.includes('baby')) return Baby;
    if (name.includes('malaria') || name.includes('disease')) return Shield;
    if (name.includes('health') || name.includes('medical')) return Stethoscope;
    if (name.includes('staff') || name.includes('user')) return Users;
    if (name.includes('asset') || name.includes('audit')) return ClipboardList;
    if (name.includes('heart') || name.includes('cardiac')) return Heart;
    if (name.includes('surveillance') || name.includes('monitor')) return Eye;
    if (name.includes('mental') || name.includes('brain')) return Brain;
    if (name.includes('drug') || name.includes('medicine')) return Pill;
    if (name.includes('activity') || name.includes('exercise')) return Activity;
    return FileText; // default
  };

  const programs: Program[] = programsArray.map((program: ApiProgram) => ({
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

  const ProgramCard: React.FC<ProgramCardProps> = ({ program }) => {
    const IconComponent = program.icon;

    return (
      <Link href={`/admin/overview/card?id=${program.id}`}>
        <div
          className={`rounded-2xl border-2 bg-white p-3 sm:p-6 ${program.borderColor} transition-all duration-300 hover:border-[#008647] hover:shadow-lg focus:border-[#008647] focus:outline-none`}
        >
          <div className="mb-3 flex items-start gap-3 sm:mb-4 sm:gap-4">
            <div
              className={`flex-shrink-0 rounded-xl p-2 sm:p-3 ${program.isActive ? 'border-green-500 bg-green-100' : 'bg-gray-100'}`}
            >
              {program.isActive ? (
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              ) : (
                <IconComponent className="h-5 w-5 text-gray-600 sm:h-6 sm:w-6" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="mb-1 text-lg font-semibold break-words text-gray-800 sm:mb-2 sm:text-xl">
                {program.name}
              </h3>
              <p className="text-xs leading-relaxed break-words whitespace-break-spaces text-gray-600 sm:text-sm">
                {program.description}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:items-center">
            <div className="flex flex-shrink-0 -space-x-2">
              {program.participants.map(
                (participant: string, index: number) => (
                  <div
                    key={`${program.id}-participant-${index}`}
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-300 sm:h-8 sm:w-8"
                  >
                    <div className=""></div>
                  </div>
                )
              )}
            </div>
            <span className="text-xs break-words text-gray-500 sm:text-sm">
              {program.participants.length > 0
                ? `${program.participants.join(', ')} are in this program`
                : 'No participants assigned'}
            </span>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="relative min-h-screen p-3 sm:p-6">
      {showLoadingOverlay && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="flex flex-col items-center rounded-lg bg-white p-6">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-[#008647]"></div>
            <p className="text-gray-600">Processing...</p>
          </div>
        </div>
      )}
      <div className="w-full">
        <div className="mb-6 flex items-center justify-between px-0 sm:mb-8 sm:px-2">
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
                  <FolderPlus className="h-5 w-5" />
                </button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-gray-900 text-white">
              <p>Create Program</p>
            </TooltipContent>
          </Tooltip>
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
        {programs.length > 0 && pagination.pages > 1 && (
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-sm text-gray-600">
                Page {currentPage} of {pagination.pages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage(Math.min(pagination.pages, currentPage + 1))
                }
                disabled={currentPage === pagination.pages}
                className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Programs;
