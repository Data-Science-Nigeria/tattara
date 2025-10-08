'use client';
import {
  PencilIcon,
  Trash2,
  ArrowLeft,
  CheckSquare,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import {
  programControllerFindOneOptions,
  programControllerFindWorkflowsByProgramOptions,
} from '@/client/@tanstack/react-query.gen';
import { Stat, StatsCard } from '../components/stat-card';
import ProgramTable from '../../components/program-table';
import EditProgramModal from '../components/edit-program-modal';
import DeleteProgramModal from '../components/delete-program-modal';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '../../../../components/ui/tooltip';

export default function Card() {
  const searchParams = useSearchParams();
  const programId = searchParams.get('id');

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch program details
  const { data: programData, isLoading: programLoading } = useQuery({
    ...programControllerFindOneOptions({
      path: { id: programId || '' },
    }),
    enabled: !!programId,
    refetchInterval: 3000, // Auto-refresh every 3 seconds
  });

  // Fetch workflows for this program
  const { data: workflowsData } = useQuery({
    ...programControllerFindWorkflowsByProgramOptions({
      path: { id: programId || '' },
    }),
    enabled: !!programId,
    refetchInterval: 3000, // Auto-refresh every 3 seconds
  });

  interface Program {
    name?: string;
    description?: string;
    users?: Array<{ id: string; name: string }>;
  }

  interface Workflow {
    name?: string;
    status?: string;
    completedAt?: string;
    assignedUser?: {
      firstName?: string;
      lastName?: string;
    };
  }

  const program = (programData as { data?: Program })?.data || {};
  const workflows = (workflowsData as { data?: Workflow[] })?.data || [];

  const stats: Stat[] = [
    {
      title: 'Active Users',
      description: 'All active users under this program',
      icon: Users,
      value: program.users?.length || 0,
    },
    {
      title: 'Completed Workflows',
      description: 'Workflows completed by assigned users',
      icon: CheckSquare,
      value:
        workflows.filter((w: Workflow) => w.status === 'completed').length || 0,
    },
  ];

  if (programLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#008647]"></div>
      </div>
    );
  }
  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <button
                onClick={() => window.history.back()}
                className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={20} />
                Back
              </button>
              <h1 className="font-poppins text-2xl font-bold">
                {program.name || 'Program Details'}
              </h1>
              <p>Manage, Edit and Delete Program</p>
            </div>
            <div className="flex gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2 rounded-lg border border-[#DB363B] bg-[#FFF5F5] px-6 py-3 text-sm font-medium text-[#DB363B] transition-colors hover:bg-[#FFE8E8] sm:px-3"
                  >
                    <Trash2 />
                    <span className="hidden sm:inline">Delete Program</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="sm:hidden">
                  Delete Program
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="font-poppins flex items-center gap-2 rounded-lg bg-[#008647] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#007A3D] sm:px-3"
                  >
                    <PencilIcon size={20} />
                    <span className="hidden sm:inline">Edit Program</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="sm:hidden">
                  Edit Program
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {stats.map((stat, index) => (
            <StatsCard key={index} stat={stat} />
          ))}
        </div>
        <ProgramTable
          data={workflows.map((workflow: Workflow) => ({
            name:
              workflow.assignedUser?.firstName +
                ' ' +
                workflow.assignedUser?.lastName || 'Unassigned',
            program: workflow.name || 'Unnamed Workflow',
            completedOn: workflow.completedAt
              ? new Date(workflow.completedAt).toLocaleDateString()
              : 'N/A',
            status: workflow.status || 'Pending',
          }))}
          programName={program.name || 'Program'}
        />

        <EditProgramModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          programData={{
            title: program.name || '',
            description: program.description || '',
          }}
          programId={programId || ''}
        />

        <DeleteProgramModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          programName={program.name || 'Program'}
          programId={programId || ''}
        />
      </div>
    </div>
  );
}
