import React from 'react';
import { FileText, Target, Users, ClipboardList } from 'lucide-react';
import Link from 'next/link';

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
          className={`rounded-2xl border-2 bg-white p-6 ${program.borderColor} transition-all duration-300 hover:shadow-lg`}
        >
          <div className="mb-4 flex items-start gap-4">
            <div
              className={`rounded-xl p-3 ${program.isActive ? 'border-green-500 bg-green-100' : 'bg-gray-100'}`}
            >
              {program.isActive ? (
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              ) : (
                <IconComponent className="h-6 w-6 text-gray-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="mb-2 text-xl font-semibold text-gray-800">
                {program.title}
              </h3>
              <p className="text-sm leading-relaxed whitespace-break-spaces text-gray-600">
                {program.description}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <div className="flex -space-x-2">
              {program.participants.map((_: string, index: number) => (
                <div
                  key={index}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-300"
                >
                  <div className=""></div>
                </div>
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-500">
              {program.participants.join(', ')} are in this program
            </span>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-semibold text-gray-800">Programs</h1>
          <Link href={'/admin/overview/create-program'}>
            <button className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-4 font-medium text-white transition-colors duration-200 hover:bg-green-700">
              Create Program
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Programs;
