'use client';

import React, { useState } from 'react';
import { FileText, Target, Users, ClipboardList, FolderPlus } from 'lucide-react';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip';
import CreateProgramModal from './components/create-program-modal';

interface Program {
  id: number;
  title: string;
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const programs = [
    {
      id: 1,
      title: 'Child Registration',
      description:
        "Capture essential details to create and manage\na child's health record.",
      icon: FileText,
      participants: ['Abeni Coker', 'John Doe'],
      isActive: false,
      borderColor: 'border-gray-200',
      href: '/overview/card',
    },
    {
      id: 2,
      title: 'Malaria Surveillance',
      description:
        'Record and track malaria cases to strengthen \nearly detection and response.',
      icon: Target,
      participants: ['Abeni Coker', 'John Doe'],
      isActive: false,
      borderColor: 'border-gray-200',
      href: '/overview/card',
    },
    {
      id: 3,
      title: 'Staff Surveillance',
      description:
        'Monitor staff activities and review recorded \nobservations in one place.',
      icon: Users,
      participants: ['Abeni Coker', 'John Doe'],
      isActive: false,
      borderColor: 'border-gray-200',
      href: '/overview/card',
    },
    {
      id: 4,
      title: 'Assets Audit',
      description:
        'Review and track all recorded assets to ensure\n accuracy and accountability.',
      icon: ClipboardList,
      participants: ['Abeni Coker', 'John Doe'],
      isActive: false,
      borderColor: 'border-gray-200',
      href: '/overview/card',
    },
  ];

  const ProgramCard: React.FC<ProgramCardProps> = ({ program }) => {
    const IconComponent = program.icon;

    return (
      <Link href={'/admin/overview/card'}>
        <div
          className={`rounded-2xl border-2 bg-white p-3 sm:p-6 ${program.borderColor} transition-all duration-300 hover:shadow-lg hover:border-[#008647] focus:border-[#008647] focus:outline-none`}
        >
          <div className="mb-3 sm:mb-4 flex items-start gap-3 sm:gap-4">
            <div
              className={`rounded-xl p-2 sm:p-3 flex-shrink-0 ${program.isActive ? 'border-green-500 bg-green-100' : 'bg-gray-100'}`}
            >
              {program.isActive ? (
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              ) : (
                <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="mb-1 sm:mb-2 text-lg sm:text-xl font-semibold text-gray-800 break-words">
                {program.title}
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed whitespace-break-spaces text-gray-600 break-words">
                {program.description}
              </p>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex -space-x-2 flex-shrink-0">
              {program.participants.map((_: string, index: number) => (
                <div
                  key={index}
                  className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 border-white bg-gray-300"
                >
                  <div className=""></div>
                </div>
              ))}
            </div>
            <span className="text-xs sm:text-sm text-gray-500 break-words">
              {program.participants.join(', ')} are in this program
            </span>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen p-3 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl lg:text-4xl font-semibold text-gray-800">Programs</h1>
          {/* Desktop button */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="hidden lg:flex items-center gap-2 rounded-lg bg-green-600 px-6 py-4 font-medium text-white transition-colors duration-200 hover:bg-green-700"
          >
            Create Program
          </button>
          
          {/* Mobile/Tablet icon with tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex lg:hidden items-center justify-center rounded-lg bg-green-600 p-3 text-white transition-colors duration-200 hover:bg-green-700"
              >
                <FolderPlus className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-gray-900 text-white">
              <p>Create Program</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
        
        <CreateProgramModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      </div>
    </div>
  );
};

export default Programs;
