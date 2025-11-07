'use client';

import React, { useState } from 'react';
import { ArrowLeft, FileText, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { programControllerGetProgramsOptions } from '@/client/@tanstack/react-query.gen';

interface Program {
  id: string;
  name: string;
  description?: string;
}

interface ApiResponse {
  data?: {
    data?: Program[];
  };
}

export default function SelectProgram() {
  const [selectedProgram, setSelectedProgram] = useState('');

  const { data: programsData, isLoading } = useQuery({
    ...programControllerGetProgramsOptions({
      query: { page: 1, limit: 100 },
    }),
  });

  const programs: Program[] = (programsData as ApiResponse)?.data?.data || [];

  const handleNext = () => {
    if (selectedProgram) {
      window.location.href = `/admin/create-workflow/workflow-details?programId=${selectedProgram}`;
    }
  };

  return (
    <div className="space-y-4 p-3 sm:space-y-6 sm:p-6 lg:space-y-8 lg:p-8">
      <div>
        <button
          onClick={() => (window.location.href = '/admin/create-workflow')}
          className="mb-3 flex items-center gap-2 text-gray-600 hover:text-gray-900 sm:mb-4"
        >
          <ArrowLeft size={18} className="sm:h-5 sm:w-5" />
          <span className="text-sm sm:text-base">Back</span>
        </button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <h1 className="mb-1 text-xl font-semibold text-gray-900 sm:mb-2 sm:text-2xl lg:text-3xl">
              Select Program
            </h1>
            <p className="text-sm text-gray-600 sm:text-base">
              Choose a program to create workflow for
            </p>
          </div>
          <button
            onClick={() =>
              (window.location.href = '/admin/overview/create-program')
            }
            className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 sm:px-4"
          >
            <Plus size={16} className="sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Create New Program</span>
            <span className="sm:hidden">Create Program</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#008647]"></div>
        </div>
      ) : programs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            No Programs Found
          </h3>
          <p className="mb-6 text-gray-600">
            You need to create a program first before creating workflows.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:gap-6">
          {programs.map((program: Program) => (
            <div key={program.id} className="relative">
              <input
                type="radio"
                id={program.id}
                name="program"
                value={program.id}
                checked={selectedProgram === program.id}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="peer sr-only"
              />
              <label
                htmlFor={program.id}
                className={`flex cursor-pointer rounded-xl border-2 p-3 transition-all hover:border-green-600 hover:shadow-lg sm:rounded-2xl sm:p-4 lg:p-6 ${
                  selectedProgram === program.id
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex w-full items-start gap-2 sm:gap-3 lg:gap-4">
                  <div
                    className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 sm:mt-1 sm:h-6 sm:w-6 ${
                      selectedProgram === program.id
                        ? 'border-green-600 bg-green-600'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full bg-white sm:h-2 sm:w-2 ${
                        selectedProgram === program.id
                          ? 'opacity-100'
                          : 'opacity-0'
                      }`}
                    ></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 sm:mb-3 sm:h-10 sm:w-10">
                      <FileText className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
                    </div>
                    <h3 className="mb-1 text-base font-semibold break-words text-gray-900 sm:mb-2 sm:text-lg">
                      {program.name}
                    </h3>
                    <p className="text-xs leading-relaxed break-words text-gray-600 sm:text-sm">
                      {program.description || 'No description available'}
                    </p>
                  </div>
                </div>
              </label>
            </div>
          ))}
        </div>
      )}

      {selectedProgram && (
        <div className="flex justify-end">
          <button
            onClick={handleNext}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 sm:px-6"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
