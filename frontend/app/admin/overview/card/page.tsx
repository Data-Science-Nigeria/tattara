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
import { useWorkflowsWithUsers } from '../hooks/useWorkflowsWithUsers';
import { Stat, StatsCard } from '../components/stat-card';
import WorkflowsSection from './components/workflows-section';
import EditProgramModal from '../components/edit-program-modal';
import DeleteProgramModal from '../components/delete-program-modal';
import AssignUsersModal from '../components/assign-users-modal';
import ProgramTable from '../../components/program-table';
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
  const [showAssignModal, setShowAssignModal] = useState(false);

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
    refetchInterval: 1000, // Auto-refresh every 1 second
  });

  interface WorkflowData {
    id: string;
    name: string;
    status?: string;
    completedAt?: string;
    enabledModes?: Array<'audio' | 'text' | 'form' | 'image'>;
    users?: Array<{
      id: string;
      firstName?: string;
      lastName?: string;
      email: string;
      completedAt?: string;
    }>;
  }

  interface HookWorkflow {
    id: string;
    name: string;
    users?: Array<{ id: string; name: string }>;
  }

  // Use basic workflow data for now
  const basicWorkflows =
    (workflowsData as { data?: WorkflowData[] })?.data || [];

  // Convert to hook format
  const hookWorkflows: HookWorkflow[] = basicWorkflows.map((w) => ({
    id: w.id,
    name: w.name,
    users:
      w.users?.map((u) => ({
        id: u.id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
      })) || [],
  }));

  // Fetch detailed workflow data with users
  const { workflowsWithUsers, isLoading: workflowsLoading } =
    useWorkflowsWithUsers(hookWorkflows);

  // Convert back to WorkflowData format for components
  const workflows: WorkflowData[] =
    workflowsWithUsers.length > 0
      ? workflowsWithUsers.map((w) => ({
          ...w,
          status: 'active' as const,
          enabledModes: ['text'] as Array<'audio' | 'text' | 'form' | 'image'>,
          users:
            w.users?.map((u) => ({
              id: u.id,
              firstName: u.name.split(' ')[0] || '',
              lastName: u.name.split(' ').slice(1).join(' ') || '',
              email: u.name.includes('@') ? u.name : `${u.name}@example.com`,
            })) || [],
        }))
      : basicWorkflows;

  interface Program {
    name?: string;
    description?: string;
    users?: Array<{ id: string; name: string }>;
    workflows?: WorkflowData[];
  }

  const program = (programData as { data?: Program })?.data || {};

  const stats: Stat[] = [
    {
      title: 'Active Users',
      description: 'All active users under this program',
      icon: Users,
      value: workflows.reduce(
        (total: number, workflow: WorkflowData) =>
          total + (workflow.users?.length || 0),
        0
      ),
    },
    {
      title: 'Total Workflows',
      description: 'All workflows in this program',
      icon: CheckSquare,
      value: workflows.length || 0,
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
    <div className="min-h-screen p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 sm:mb-8">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <button
                onClick={() => window.history.back()}
                className="mb-3 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 sm:mb-4 sm:text-base"
              >
                <ArrowLeft size={16} className="sm:h-5 sm:w-5" />
                Back
              </button>
              <h1 className="font-poppins text-lg font-bold sm:text-xl md:text-2xl">
                {program.name || 'Program Details'}
              </h1>
              <p className="text-sm text-gray-600 sm:text-base">
                Manage, Edit and Delete Program
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 md:gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-[#DB363B] bg-[#FFF5F5] px-3 py-2 text-xs font-medium text-[#DB363B] transition-colors hover:bg-[#FFE8E8] sm:px-4 sm:py-2 sm:text-sm md:px-6 md:py-3"
                  >
                    <Trash2 size={16} className="sm:h-5 sm:w-5" />
                    <span className="sm:hidden md:inline">Delete Program</span>
                    <span className="hidden sm:inline md:hidden">Delete</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="md:hidden">
                  Delete Program
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-[#008647] bg-white px-3 py-2 text-xs font-medium text-[#008647] transition-colors hover:bg-[#008647] hover:text-white sm:px-4 sm:py-2 sm:text-sm md:px-6 md:py-3"
                  >
                    <Users size={16} className="sm:h-5 sm:w-5" />
                    <span className="sm:hidden md:inline">Assign Users</span>
                    <span className="hidden sm:inline md:hidden">Assign</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="md:hidden">
                  Assign Users
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="font-poppins flex items-center justify-center gap-2 rounded-lg bg-[#008647] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#007A3D] sm:px-4 sm:py-2 sm:text-sm md:px-6 md:py-3"
                  >
                    <PencilIcon size={16} className="sm:h-5 sm:w-5" />
                    <span className="sm:hidden md:inline">Edit Program</span>
                    <span className="hidden sm:inline md:hidden">Edit</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="md:hidden">
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

        <WorkflowsSection
          workflows={workflows.map((w) => ({
            ...w,
            status:
              (w.status as 'active' | 'inactive' | 'archived') || 'active',
            enabledModes: w.enabledModes || ['text'],
            users:
              w.users?.map((u) => ({
                firstName: u.firstName || '',
                lastName: u.lastName || '',
              })) || [],
          }))}
          programId={programId || ''}
          programName={program.name || 'Program'}
          isLoading={workflowsLoading}
        />

        <div className="mt-4">
          <ProgramTable
            data={workflows.flatMap(
              (workflow: WorkflowData) =>
                workflow.users?.map((user) => ({
                  name:
                    `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                    user.email,
                  program: workflow.name,
                  completedOn:
                    user.completedAt || workflow.completedAt || 'N/A',
                  status:
                    user.completedAt || workflow.completedAt
                      ? 'Completed'
                      : 'Pending',
                })) || []
            )}
          />
        </div>

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

        <AssignUsersModal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            // Force immediate refresh after closing modal
            window.location.reload();
          }}
          programName={program.name || 'Program'}
          programId={programId || ''}
        />
      </div>
    </div>
  );
}
