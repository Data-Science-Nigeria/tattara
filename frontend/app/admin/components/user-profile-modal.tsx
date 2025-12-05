'use client';

import React, { useState } from 'react';
import { Eye, X, User, Mail } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { userControllerFindAllForLoggedInUserOptions } from '@/client/@tanstack/react-query.gen';

interface UserProfileModalProps {
  userId: string;
  userName: string;
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

export default function UserProfileModal({ userId }: UserProfileModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: usersData, isLoading } = useQuery({
    ...userControllerFindAllForLoggedInUserOptions({
      query: { page: 1, limit: 1000000 },
    }),
    enabled: isOpen,
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
  const user = users.find((u: User) => u.id === userId);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-xs text-green-700 transition-colors hover:bg-green-200"
      >
        <Eye className="h-3 w-3" />
        View Profile
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
            </div>
          ) : !user ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">User not found</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="border-b border-gray-200 bg-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-300">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        {user.firstName} {user.lastName}
                      </h2>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                  User Information
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
