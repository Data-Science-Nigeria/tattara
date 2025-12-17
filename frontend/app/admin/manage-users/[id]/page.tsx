'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, User, Mail, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { userControllerFindAllForLoggedInUserOptions } from '@/client/@tanstack/react-query.gen';
import UserSubmissionsTab from '@/components/admin/UserSubmissionsTab';

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

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [showSubmissions, setShowSubmissions] = useState(false);
  const { id } = React.use(params);

  const { data: usersData, isLoading } = useQuery({
    ...userControllerFindAllForLoggedInUserOptions({
      query: { page: 1, limit: 100 },
    }),
  });

  const responseData = (usersData as UsersResponse)?.data;
  const users = Array.isArray(responseData)
    ? responseData
    : responseData &&
        'users' in responseData &&
        Array.isArray(responseData.users)
      ? responseData.users
      : [];
  const user = users.find((u: User) => u.id === id);

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-300">
              <User className="h-8 w-8 text-gray-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold text-gray-800">
                {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
              </h1>
              {user && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
            </div>
          ) : !user ? (
            <div className="py-8 text-center">
              <p className="text-gray-600">User not found</p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                <h2 className="text-lg font-semibold text-gray-800">
                  {showSubmissions ? 'User Submissions' : 'User Information'}
                </h2>
                <button
                  onClick={() => setShowSubmissions(!showSubmissions)}
                  className="flex items-center gap-1 rounded-md bg-[#008647] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#006635] sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                >
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                  {showSubmissions ? 'User Info' : 'User Submissions'}
                </button>
              </div>

              {showSubmissions ? (
                <UserSubmissionsTab userId={id} />
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-800">
                      {user.firstName || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-800">
                      {user.lastName || 'N/A'}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 break-all text-gray-800">
                      {user.email}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Email Status
                    </label>
                    <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2">
                      <StatusBadge isVerified={user.isEmailVerified} />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Account Created
                    </label>
                    <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-800">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
