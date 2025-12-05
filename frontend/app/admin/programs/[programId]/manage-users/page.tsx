'use client';

import React, { useState } from 'react';
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
            Manage User
          </h1>
          <p className="text-sm text-gray-600 sm:text-base">
            View, Edit, Suspend and Delete Users
          </p>
        </div>
        <div className="flex flex-col gap-2 lg:flex-row lg:gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 rounded-lg border-2 border-green-600 bg-white px-4 py-2 text-sm font-medium text-green-800 transition-colors hover:border-green-800 hover:bg-green-800 hover:text-white sm:px-6 sm:text-base"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
            <span className="whitespace-nowrap">Add User</span>
          </button>
          <div className="relative">
            <button
              onClick={handleUploadDropdownClick}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-900 sm:px-6 sm:text-base lg:w-auto"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="whitespace-nowrap">Upload Users</span>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
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
      <StatsCards totalUsers={totalUsers} />

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
