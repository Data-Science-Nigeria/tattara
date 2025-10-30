import { useQueries } from '@tanstack/react-query';
import { workflowControllerFindWorkflowByIdOptions } from '@/client/@tanstack/react-query.gen';

interface Workflow {
  id: string;
  name: string;
  users?: Array<{ id: string; name: string }>;
}

export function useWorkflowsWithUsers(workflows: Workflow[]) {
  const workflowQueries = useQueries({
    queries: workflows.map((workflow) => ({
      ...workflowControllerFindWorkflowByIdOptions({
        path: { workflowId: workflow.id },
      }),
      enabled: !!workflow.id,
      refetchInterval: 3000,
    })),
  });

  // Extract successful results
  const workflowsWithUsers = workflowQueries
    .filter((query) => query.data)
    .map((query) => {
      const data = (query.data as { data?: Workflow })?.data;
      return data;
    })
    .filter(Boolean) as Workflow[];

  const isLoading = workflowQueries.some((query) => query.isLoading);

  return { workflowsWithUsers, isLoading };
}
