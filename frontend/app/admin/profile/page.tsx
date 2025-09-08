'use client';
import React from 'react';
import { ArrowLeft, User, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { BioDataForm } from './components/bioDataForm';
import { WorkflowHistory } from './components/workHistory';

// Types
interface UserProfile {
  id: string;
  name: string;
  userNumber: string;
  status: 'Active' | 'Inactive';
  bio: {
    firstName: string;
    lastName: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    dateOfSymptoms: string;
    testResults: 'Positive' | 'Negative' | 'Unknown';
    mosquitoSpecies: string;
    symptoms: string[];
  };
  workflowHistory: WorkflowRecord[];
}

interface WorkflowRecord {
  id: string;
  title: string;
  description: string;
  status: 'Completed' | 'Pending' | 'In Progress';
  completedDate: string;
  uploadedFiles: string[];
}

const UserProfileDashboard = () => {
  // Sample data
  const user: UserProfile = {
    id: '123445',
    name: 'Abeni Coker',
    userNumber: '123443NC',
    status: 'Active',
    bio: {
      firstName: 'Abeni',
      lastName: 'Coker',
      age: 21,
      gender: 'Female',
      dateOfSymptoms: '17/08/2025',
      testResults: 'Unknown',
      mosquitoSpecies: 'Mixed',
      symptoms: ['Headache', 'Drowsiness'],
    },
    workflowHistory: [
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
    ],
  };

  type StatusType =
    | 'Active'
    | 'Completed'
    | 'Pending'
    | 'In Progress'
    | 'Inactive';
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

  // const BioDataForm = () => (
  //   <div className="p-8">
  //     <div className="mb-6">
  //       <h3 className="text-2xl font-semibold text-gray-800 mb-2">Captured Bio Data</h3>
  //       <p className="text-gray-600">This form displays the bio data submitted by the user.</p>
  //     </div>

  //     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
  //       {/* First Name */}
  //       <div>
  //         <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
  //         <input
  //           type="text"
  //           value={user.bio.firstName}
  //           readOnly
  //           className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none"
  //         />
  //       </div>

  //       {/* Last Name */}
  //       <div>
  //         <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
  //         <input
  //           type="text"
  //           value={user.bio.lastName}
  //           readOnly
  //           className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none"
  //         />
  //       </div>

  //       {/* Age */}
  //       <div>
  //         <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
  //         <input
  //           type="number"
  //           value={user.bio.age}
  //           readOnly
  //           className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none"
  //         />
  //       </div>

  //       {/* Gender */}
  //       <div>
  //         <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
  //         <div className="relative">
  //           <select
  //             value={user.bio.gender}
  //             disabled
  //             className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 appearance-none focus:outline-none"
  //           >
  //             <option value="Female">Female</option>
  //             <option value="Male">Male</option>
  //             <option value="Other">Other</option>
  //           </select>
  //           <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
  //         </div>
  //       </div>

  //       {/* Date of Start of Symptoms */}
  //       <div>
  //         <label className="block text-sm font-medium text-gray-700 mb-2">Date of Start of Symptoms</label>
  //         <div className="relative">
  //           <input
  //             type="text"
  //             value={user.bio.dateOfSymptoms}
  //             readOnly
  //             className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none"
  //           />
  //           <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
  //         </div>
  //       </div>

  //       {/* Test Results */}
  //       <div>
  //         <label className="block text-sm font-medium text-gray-700 mb-2">Test Results (if applicable)</label>
  //         <div className="relative">
  //           <select
  //             value={user.bio.testResults}
  //             disabled
  //             className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 appearance-none focus:outline-none"
  //           >
  //             <option value="Unknown">Unknown</option>
  //             <option value="Positive">Positive</option>
  //             <option value="Negative">Negative</option>
  //           </select>
  //           <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
  //         </div>
  //       </div>
  //     </div>

  //     {/* Mosquito Species */}
  //     <div className="mb-8">
  //       <label className="block text-sm font-medium text-gray-700 mb-2">Mosquito Species (if applicable)</label>
  //       <div className="relative">
  //         <select
  //           value={user.bio.mosquitoSpecies}
  //           disabled
  //           className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 appearance-none focus:outline-none"
  //         >
  //           <option value="Mixed">Mixed</option>
  //           <option value="Anopheles">Anopheles</option>
  //           <option value="Aedes">Aedes</option>
  //         </select>
  //         <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
  //       </div>
  //     </div>

  //     {/* Select Symptoms */}
  //     <div>
  //       <label className="block text-sm font-medium text-gray-700 mb-4">Select Symptoms</label>
  //       <div className="space-y-3">
  //         {allSymptoms.map((symptom) => {
  //           const isSelected = user.bio.symptoms.includes(symptom);
  //           return (
  //             <label key={symptom} className="flex items-center">
  //               <input
  //                 type="checkbox"
  //                 checked={isSelected}
  //                 disabled
  //                 className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50"
  //               />
  //               <span className={`ml-3 text-sm ${isSelected ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
  //                 {symptom}
  //               </span>
  //             </label>
  //           );
  //         })}
  //       </div>
  //     </div>
  //   </div>
  // );

  // const WorkflowHistory = () => (
  //   <div className="p-8">
  //     <div className="mb-6">
  //       <h3 className="text-2xl font-semibold text-gray-800 mb-2">Workflow History</h3>
  //       <p className="text-gray-600">Records of workflows user has completed</p>
  //     </div>

  //     <div className="space-y-6">
  //       {user.workflowHistory.map((workflow) => (
  //         <div key={workflow.id} className="border border-gray-200 rounded-xl p-6 bg-white">
  //           <div className="flex items-start justify-between mb-4">
  //             <div className="flex items-center gap-3">
  //               <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
  //                 <FileText className="w-5 h-5 text-green-600" />
  //               </div>
  //               <div>
  //                 <h4 className="text-lg font-semibold text-gray-800">{workflow.title}</h4>
  //                 <p className="text-sm text-gray-600">{workflow.description}</p>
  //               </div>
  //             </div>
  //             <div className="flex items-center gap-4">
  //               <div className="flex items-center gap-2 text-gray-500">
  //                 <Calendar className="w-4 h-4" />
  //                 <span className="text-sm">Completed {workflow.completedDate}</span>
  //               </div>
  //               <StatusBadge status={workflow.status} />
  //             </div>
  //           </div>

  //           {workflow.uploadedFiles.length > 0 && (
  //             <div className="mb-4">
  //               <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Files</p>
  //               <div className="flex items-center gap-2">
  //                 {workflow.uploadedFiles.map((file, index) => (
  //                   <span key={index} className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-lg">
  //                     {file}
  //                   </span>
  //                 ))}
  //               </div>
  //             </div>
  //           )}

  //           <div className="flex justify-end">
  //             <button className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200">
  //               <Eye className="w-4 h-4" />
  //               View Details
  //             </button>
  //           </div>
  //         </div>
  //       ))}
  //     </div>
  //   </div>
  // );

  return (
    <div className="flex min-h-screen">
      <div className="flex-1">
        {/* Header */}
        <div className="border-b border-gray-200 px-8 py-6">
          <div className="mb-8 flex items-center gap-4">
            <Link
              href="/users"
              className="flex items-center gap-2 text-gray-600 transition-colors duration-200 hover:text-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-300">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-semibold text-gray-800">
                      {user.name}
                    </h1>
                    <StatusBadge status={user.status} />
                  </div>
                  <p className="text-gray-600">No. {user.userNumber}</p>
                </div>
              </div>
            </div>
            <button className="flex items-center gap-2 rounded-lg border border-[#DB363B] bg-[#FFF5F5] px-6 py-3 font-medium text-[#DB363B] transition-colors duration-200 hover:bg-red-600">
              <Trash2 className="h-5 w-5" />
              Delete User
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <BioDataForm />
          <WorkflowHistory />
        </div>
      </div>
    </div>
  );
};

export default UserProfileDashboard;
