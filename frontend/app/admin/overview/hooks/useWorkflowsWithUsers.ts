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
      console.log('Individual workflow data:', data);
      console.log('Full workflow object keys:', Object.keys(data || {}));
      return data;
    })
    .filter(Boolean) as Workflow[];

  const isLoading = workflowQueries.some((query) => query.isLoading);

  console.log('Custom hook - workflows input:', workflows);
  console.log('Custom hook - workflowsWithUsers output:', workflowsWithUsers);

  return { workflowsWithUsers, isLoading };
}
