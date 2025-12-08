'use client';

import { UserMinus } from 'lucide-react';

interface WorkflowAssignment {
  id: string;
  userId: string;
  workflowId: string;
  status: 'pending' | 'completed';
  user: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
  workflow: {
    name: string;
    enabledModes?: string[];
  };
}

interface AssignedWorkflowsTableProps {
  assignments: WorkflowAssignment[];
  isLoading: boolean;
  onUnassign: (
    userId: string,
    workflowId: string,
    userName: string,
    workflowName: string
  ) => void;
}

export default function AssignedWorkflowsTable({
  assignments,
  isLoading,
  onUnassign,
}: AssignedWorkflowsTableProps) {
  return (
    <div className="custom-scrollbar overflow-hidden rounded-lg bg-white shadow">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Assigned Workflow
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Mode
              </th>
              <th className="sticky right-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center py-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#008647]"></div>
                    <span className="ml-2 text-sm text-gray-500">
                      Loading assignments...
                    </span>
                  </div>
                </td>
              </tr>
            ) : assignments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No workflow assignments found
                </td>
              </tr>
            ) : (
              assignments.map((assignment) => {
                const userName =
                  `${assignment.user.firstName || ''} ${assignment.user.lastName || ''}`.trim() ||
                  assignment.user.email;
                return (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {userName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {assignment.workflow.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          assignment.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {assignment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                      {assignment.workflow.enabledModes?.join(', ') || 'N/A'}
                    </td>
                    <td className="sticky right-0 bg-white px-6 py-4 text-sm font-medium whitespace-nowrap">
                      <button
                        onClick={() =>
                          onUnassign(
                            assignment.userId,
                            assignment.workflowId,
                            userName,
                            assignment.workflow.name
                          )
                        }
                        className="flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-600 transition-colors hover:bg-red-100"
                      >
                        <UserMinus size={14} />
                        Unassign
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
