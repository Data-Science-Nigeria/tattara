'use client';

import {
  Archive,
  MoreHorizontal,
  Link2,
  Edit,
  TestTube,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Workflow } from '@/client/types.gen';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ActiveWorkflowsTableProps {
  workflows: Workflow[];
  isLoading: boolean;
  onArchive: (workflowId: string, workflowName: string) => void;
  onDeleteConfig: (configId: string, workflowName: string) => void;
}

export default function ActiveWorkflowsTable({
  workflows,
  isLoading,
  onArchive,
  onDeleteConfig,
}: ActiveWorkflowsTableProps) {
  const router = useRouter();

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
                Description
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
                      Loading workflows...
                    </span>
                  </div>
                </td>
              </tr>
            ) : workflows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No active workflows found
                </td>
              </tr>
            ) : (
              workflows.map((workflow) => (
                <tr key={workflow.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {workflow.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {workflow.description || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                        Active
                      </span>
                      {workflow.workflowConfigurations &&
                        workflow.workflowConfigurations.length > 0 && (
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              workflow.fieldMappings &&
                              workflow.fieldMappings.length > 0
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {workflow.fieldMappings &&
                            workflow.fieldMappings.length > 0
                              ? 'mapped'
                              : 'not mapped'}
                          </span>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                    {workflow.enabledModes?.join(', ') || 'N/A'}
                  </td>
                  <td className="sticky right-0 bg-white px-6 py-4 text-sm font-medium whitespace-nowrap">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-gray-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {workflow.workflowConfigurations &&
                        workflow.workflowConfigurations.length > 0 ? (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/admin/programs/${workflow.program.id}/create-workflow/field-mapping?workflowId=${workflow.id}`
                                )
                              }
                            >
                              <Link2 className="mr-2 h-4 w-4" />
                              Map
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/admin/programs/${workflow.program.id}/create-workflow/unified-workflow?workflowId=${workflow.id}`
                                )
                              }
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                onDeleteConfig(
                                  workflow.workflowConfigurations[0].id,
                                  workflow.name
                                )
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Config
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                onArchive(workflow.id, workflow.name)
                              }
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/admin/programs/${workflow.program.id}/create-workflow/manual-test?workflowId=${workflow.id}&inputType=${workflow.enabledModes?.[0] || 'text'}`
                                )
                              }
                            >
                              <TestTube className="mr-2 h-4 w-4" />
                              Test
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/admin/programs/${workflow.program.id}/create-workflow/unified-workflow?workflowId=${workflow.id}`
                                )
                              }
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                onArchive(workflow.id, workflow.name)
                              }
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
