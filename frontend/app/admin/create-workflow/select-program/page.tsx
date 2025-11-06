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
    <div className="space-y-8 p-8">
      <div>
        <button
          onClick={() => (window.location.href = '/admin/create-workflow')}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-semibold text-gray-900">
              Select Program
            </h1>
            <p className="text-gray-600">
              Choose a program to create workflow for
            </p>
          </div>
          <button
            onClick={() =>
              (window.location.href = '/admin/overview/create-program')
            }
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700"
          >
            <Plus size={20} />
            Create New Program
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                className={`flex cursor-pointer rounded-2xl border-2 p-6 transition-all hover:border-green-600 hover:shadow-lg ${
                  selectedProgram === program.id
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex w-full items-start gap-4">
                  <div
                    className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                      selectedProgram === program.id
                        ? 'border-green-600 bg-green-600'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    <div
                      className={`h-2 w-2 rounded-full bg-white ${
                        selectedProgram === program.id
                          ? 'opacity-100'
                          : 'opacity-0'
                      }`}
                    ></div>
                  </div>
                  <div className="flex-1">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">
                      {program.name}
                    </h3>
                    <p className="leading-relaxed text-gray-600">
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
            className="rounded-lg bg-green-600 px-6 py-2 font-medium text-white transition-colors hover:bg-green-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
