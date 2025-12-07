'use client';

import React, { useState } from 'react';
import { UserPlus, CloudUpload, ChevronDown } from 'lucide-react';
import UserTable from '@/app/admin/components/user-table';
import AddUserModal from './components/add-user-modal';
import UploadDropdown from './components/upload-dropdown';
import StatsCards from './components/stats-cards';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userControllerFindAllForLoggedInUserOptions } from '@/client/@tanstack/react-query.gen';

export default function ManageUsers() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadDropdown, setShowUploadDropdown] = useState(false);
  const [uploadDropdownCoords, setUploadDropdownCoords] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  // Fetch users data
  const {
    data: usersData,
    isLoading,
    refetch,
  } = useQuery({
    ...userControllerFindAllForLoggedInUserOptions({
      query: { page: 1, limit: 1000000 },
    }),
  });

  const handleUserCreated = () => {
    refetch();
    queryClient.invalidateQueries({
      predicate: (query) =>
        query.queryKey[0] === 'userControllerFindAllForLoggedInUser',
    });
  };

  interface User {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    status?: string;
    isEmailVerified?: boolean;
    createdAt?: string;
  }

  interface UsersResponse {
    data:
      | {
          users: User[];
        }
      | User[];
  }

  // Fix data extraction based on API response structure
  const responseData = (usersData as UsersResponse)?.data;
  const users = Array.isArray(responseData)
    ? responseData
    : responseData &&
        'users' in responseData &&
        Array.isArray(responseData.users)
      ? responseData.users
      : [];
  const totalUsers = users.length;
  const activeUsers = users.filter(
    (user: User) => user.isEmailVerified === true
  ).length;

  const handleUploadDropdownClick = (event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const dropdownWidth = rect.width + 200;
    setUploadDropdownCoords({
      top: rect.bottom + 8,
      left: rect.right - dropdownWidth,
      width: dropdownWidth,
    });
    setShowUploadDropdown(!showUploadDropdown);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 sm:text-2xl">
            Manage Users
          </h1>
        </div>
        <div className="flex flex-col gap-2 lg:flex-row lg:gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 rounded-lg border-2 border-green-600 bg-white px-4 py-2 text-sm font-medium text-green-800 transition-colors hover:border-green-800 hover:bg-green-800 hover:text-white sm:px-6 sm:text-base"
          >
            <UserPlus className="h-4 w-4" />
            <span className="whitespace-nowrap">Add User</span>
          </button>
          <div className="relative">
            <button
              onClick={handleUploadDropdownClick}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-900 sm:px-6 sm:text-base lg:w-auto"
            >
              <CloudUpload className="h-4 w-4" />
              <span className="whitespace-nowrap">Upload Users</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            <UploadDropdown
              isOpen={showUploadDropdown}
              onClose={() => setShowUploadDropdown(false)}
              coords={uploadDropdownCoords}
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <StatsCards totalUsers={totalUsers} activeUsers={activeUsers} />

      {/* User Table */}
      <UserTable
        data={users.map((user: User) => ({
          id: user.id,
          name:
            `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
            user.email,
          email: user.email,
          status:
            user.status ||
            (user.isEmailVerified === false ? 'Pending' : 'Active'),
          createdBy: user.createdAt
            ? new Date(user.createdAt).toLocaleDateString()
            : 'N/A',
        }))}
        isLoading={isLoading}
      />

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onUserCreated={handleUserCreated}
      />
    </div>
  );
}
