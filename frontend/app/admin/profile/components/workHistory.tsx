import { Calendar, FileText } from 'lucide-react';

interface WorkflowRecord {
  id: string;
  title: string;
  description: string;
  status: StatusType;
  completedDate: string;
  uploadedFiles: string[];
}

const workflowHistory: WorkflowRecord[] = [
  {
    id: '1',
    title: 'Malaria Surveillance',
    description:
      'Record and track malaria cases to strengthen early detection and response.',
    status: 'Completed',
    completedDate: '25/06/2025',
    uploadedFiles: ['AUD1234-045.mp3'],
  },
  {
    id: '2',
    title: 'Malaria Surveillance',
    description:
      'Record and track malaria cases to strengthen early detection and response.',
    status: 'Completed',
    completedDate: '25/06/2025',
    uploadedFiles: [],
  },
];

type StatusType =
  | 'Active'
  | 'Inactive'
  | 'Completed'
  | 'Pending'
  | 'In Progress';

const StatusBadge = ({ status }: { status: StatusType }) => {
  const styles: Record<StatusType, string> = {
    Active: 'bg-green-100 text-green-700 border-green-200',
    Inactive: 'bg-gray-100 text-gray-700 border-gray-200',
    Completed: 'bg-green-100 text-green-700 border-green-200',
    Pending: 'bg-orange-100 text-orange-700 border-orange-200',
    'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}
    >
      {status}
    </span>
  );
};

export function WorkflowHistory() {
  return (
    <div className="p-8">
      {workflowHistory.map((workflow) => (
        <div
          key={workflow.id}
          className="rounded-xl border border-gray-200 bg-white p-6"
        >
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="text-lg font-semibold text-gray-800">
                  {workflow.title}
                </h4>
                <p className="text-sm text-gray-600">{workflow.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                Completed {workflow.completedDate}
              </span>
              <StatusBadge status={workflow.status} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
