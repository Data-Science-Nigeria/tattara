'use client';

import React from 'react';
import { ArrowLeft, User, Mail } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { userControllerFindAllForLoggedInUserOptions } from '@/client/@tanstack/react-query.gen';

interface UserProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

const StatusBadge = ({ isVerified }: { isVerified: boolean }) => {
  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-medium ${
        isVerified
          ? 'bg-green-100 text-green-700'
          : 'bg-orange-100 text-orange-700'
      }`}
    >
      {isVerified ? 'Verified' : 'Pending'}
    </span>
  );
};

export default function UserProfilePage({ params }: UserProfilePageProps) {
  const resolvedParams = React.use(params);

  const { data: usersData, isLoading } = useQuery({
    ...userControllerFindAllForLoggedInUserOptions({
      query: { page: 1, limit: 1000 }, // Get all users to find the specific one
    }),
  });

  interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isEmailVerified: boolean;
    createdAt: string;
    roles: string[];
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
  const user = users.find((u: User) => u.id === resolvedParams.id);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">User not found</p>
          <Link
            href="/admin/user-profile"
            className="mt-4 inline-flex items-center gap-2 text-green-600 hover:text-green-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-3 py-4 sm:px-6 sm:py-6 md:px-8">
        <div className="mb-4 sm:mb-6">
          <Link
            href="/admin/user-profile"
            className="flex items-center gap-2 text-gray-600 transition-colors duration-200 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Back to Users</span>
          </Link>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 sm:h-12 sm:w-12 md:h-16 md:w-16">
            <User className="h-5 w-5 text-gray-600 sm:h-6 sm:w-6 md:h-8 md:w-8" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-gray-800 sm:text-xl md:text-2xl lg:text-3xl">
              {user?.firstName} {user?.lastName}
            </h1>
            <div className="mt-1 flex items-start gap-1 text-xs text-gray-600 sm:items-center sm:text-sm">
              <Mail className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
              <span className="break-all">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-6 md:p-8">
        <div className="rounded-lg bg-white p-3 shadow sm:p-4 md:p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-800 sm:mb-6 sm:text-lg md:text-xl">
            User Information
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                First Name
              </label>
              <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-800">
                {user?.firstName || 'N/A'}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-800">
                {user?.lastName || 'N/A'}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 break-all text-gray-800">
                {user?.email}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email Status
              </label>
              <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2">
                <StatusBadge isVerified={user?.isEmailVerified} />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Account Created
              </label>
              <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-800">
                {new Date(user?.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
