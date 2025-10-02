'use client';
import {
  ChevronDown,
  Download,
  Filter,
  PencilIcon,
  Search,
  Trash2,
  ArrowLeft,
  CheckSquare,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Stat, StatsCard } from '../components/stat-card';
import ProgramTable from '../../components/program-table';
import EditProgramModal from '../components/edit-program-modal';
import DeleteProgramModal from '../components/delete-program-modal';
import { Tooltip, TooltipTrigger, TooltipContent } from '../../../../components/ui/tooltip';

export default function Card() {
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const programData = {
    title: 'Child Surveillance',
    description: 'Monitor and track child health and development indicators'
  };
  const stats: Stat[] = [
    {
      title: 'Active Users',
      description: 'All active users under this program',
      icon: Users,
      value: 12,
    },
    {
      title: 'Completed Workflows',
      description: 'Workflows completed by assigned users',
      icon: CheckSquare,
      value: 8,
    },
  ];
  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <button 
                onClick={() => window.history.back()}
                className="flex items-center gap-2 mb-4 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={20} />
                Back
              </button>
              <h1 className="font-poppins text-2xl font-bold">
                Child Surveillance
              </h1>
              <p>Manage, Edit and Delete Program</p>
            </div>
            <div className="flex gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2 rounded-lg border border-[#DB363B] bg-[#FFF5F5] px-6 py-3 sm:px-3 text-sm font-medium text-[#DB363B] hover:bg-[#FFE8E8] transition-colors"
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
                    className="font-poppins flex items-center gap-2 rounded-lg bg-[#008647] px-6 py-3 sm:px-3 text-sm font-medium text-white hover:bg-[#007A3D] transition-colors"
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
        <ProgramTable data={[
          { name: 'John Doe', program: 'Child Surveillance', completedOn: '2024-01-15', status: 'Completed' },
          { name: 'Jane Smith', program: 'Health Monitoring', completedOn: null, status: 'Pending' },
          { name: 'Mike Johnson', program: 'Vaccination Program', completedOn: '2024-01-10', status: 'Completed' },
          { name: 'Sarah Wilson', program: 'Nutrition Tracking', completedOn: null, status: 'Pending' },
          { name: 'David Brown', program: 'Growth Monitoring', completedOn: '2024-01-20', status: 'Completed' }
        ]} />
        
        <EditProgramModal 
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          programData={programData}
        />
        
        <DeleteProgramModal 
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          programName="Child Surveillance"
        />
      </div>
    </div>
  );
}
