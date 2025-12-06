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
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  programControllerFindOneOptions,
  programControllerFindWorkflowsByProgramOptions,
  collectorControllerGetSubmissionHistoryOptions,
} from '@/client/@tanstack/react-query.gen';

import { Stat, StatsCard } from './components/stat-card';
import EditProgramModal from './components/edit-program-modal';
import DeleteProgramModal from './components/delete-program-modal';
import AssignUsersProgramModal from './components/assign-users-program-modal';
import UnassignUserProgramModal from './components/unassign-user-program-modal';
import ProgramTable from '@/app/admin/components/program-table';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

export default function Overview() {
  const params = useParams();
  const programId = params.programId as string;

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUnassignProgramModal, setShowUnassignProgramModal] =
    useState(false);
  const [unassignProgramData, setUnassignProgramData] = useState<{
    userId: string;
    userName: string;
  } | null>(null);

  // Fetch program details
  const {
    data: programData,
    isLoading: programLoading,
    refetch: refetchProgram,
  } = useQuery({
    ...programControllerFindOneOptions({
      path: { id: programId || '' },
    }),
    enabled: !!programId,
  });

  // Fetch workflows for this program (basic count only)
  const { data: workflowsData } = useQuery({
    ...programControllerFindWorkflowsByProgramOptions({
      path: { id: programId || '' },
    }),
    enabled: !!programId,
  });

  const workflows =
    (workflowsData as { data?: Array<{ id: string; name: string }> })?.data ||
    [];

  // Fetch completed submissions for all workflows in this program
  const { data: submissionsData } = useQuery({
    ...collectorControllerGetSubmissionHistoryOptions({
      query: {
        status: 'completed',
        limit: 100, // Get all completed submissions
      },
    }),
    enabled: workflows.length > 0,
  });

  interface Program {
    name?: string;
    description?: string;
    users?: Array<{ id: string; firstName?: string; lastName?: string }>;
  }

  const program = (programData as { data?: Program })?.data || {};

  // Get program-level users (users assigned directly to the program)
  const programUsers = program.users || [];

  // Count total workflows for this program
  const totalWorkflows = workflows.length;

  // Calculate completed workflows count from submissions
  const submissions =
    (submissionsData as { data?: Array<{ workflowId: string }> })?.data || [];
  const workflowIds = workflows.map((w) => w.id);
  const completedWorkflows = submissions.filter((s) =>
    workflowIds.includes(s.workflowId)
  ).length;

  const stats: Stat[] = [
    {
      title: 'Active Users',
      description: 'All active users under this program',
      icon: Users,
      value: programUsers.length,
    },
    {
      title: 'Completed Workflows',
      description: 'Workflows completed by assigned users',
      icon: CheckSquare,
      value: completedWorkflows,
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
              <Link
                href="/admin/dashboard"
                className="mb-3 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 sm:mb-4 sm:text-base"
              >
                <ArrowLeft size={16} className="sm:h-5 sm:w-5" />
                Back to Dashboard
              </Link>
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

        <div className="mt-4">
          <ProgramTable
            data={programUsers.map((user) => ({
              name:
                user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : 'Unknown User',
              totalWorkflows: totalWorkflows,
              userId: user.id,
            }))}
            programName={program.name || 'Program'}
            onUnassign={(userId: string, userName: string) => {
              setUnassignProgramData({ userId, userName });
              setShowUnassignProgramModal(true);
            }}
          />
        </div>

        {/* Modals */}
        {showEditModal && (
          <EditProgramModal
            isOpen={showEditModal}
            programId={programId || ''}
            onClose={() => setShowEditModal(false)}
          />
        )}

        {showDeleteModal && (
          <DeleteProgramModal
            isOpen={showDeleteModal}
            programId={programId || ''}
            onClose={() => setShowDeleteModal(false)}
          />
        )}

        {showAssignModal && (
          <AssignUsersProgramModal
            isOpen={showAssignModal}
            programId={programId || ''}
            programName={program.name || 'Program'}
            onClose={() => {
              setShowAssignModal(false);
              refetchProgram(); // Refetch program data to get updated users
            }}
          />
        )}

        {showUnassignProgramModal && unassignProgramData && (
          <UnassignUserProgramModal
            isOpen={showUnassignProgramModal}
            userId={unassignProgramData.userId}
            programId={programId || ''}
            userName={unassignProgramData.userName}
            programName={program.name || 'Program'}
            onClose={() => {
              setShowUnassignProgramModal(false);
              setUnassignProgramData(null);
              refetchProgram();
            }}
          />
        )}
      </div>
    </div>
  );
}
