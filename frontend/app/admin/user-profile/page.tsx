'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { userControllerFindAllForLoggedInUserOptions } from '@/client/@tanstack/react-query.gen';
import UserProfileTable from './components/user-profile-table';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isEmailVerified: boolean;
  roles: Array<{ name: string }>;
  createdAt: string;
  lastLoginAt?: string;
}

export default function UserProfilesPage() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const { data: usersData, isLoading } = useQuery({
    ...userControllerFindAllForLoggedInUserOptions({
      query: { page: currentPage, limit },
    }),
  });

  interface UsersResponse {
    data:
      | {
          users: User[];
          pagination?: {
            total: number;
          };
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
  const totalUsers =
    (responseData &&
      'pagination' in responseData &&
      responseData.pagination?.total) ||
    users.length;
  const totalPages = Math.ceil(totalUsers / limit);

  const filteredUsers = users.filter(
    (user: User) =>
      `${user.firstName} ${user.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            User Profiles
          </h1>
          <p className="text-gray-600">
            View and manage all user profiles on the platform
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-10 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid max-w-sm grid-cols-1 gap-4 sm:grid-cols-1">
        <div className="relative rounded-lg bg-white p-4 shadow">
          <div className="absolute top-3 right-3 rounded-full bg-green-100 p-2">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Users</p>
            <h2 className="text-2xl font-semibold">{totalUsers}</h2>
            <p className="text-xs text-gray-400">All registered users</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <UserProfileTable
        users={filteredUsers}
        isLoading={isLoading}
        currentPage={currentPage}
        limit={limit}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
