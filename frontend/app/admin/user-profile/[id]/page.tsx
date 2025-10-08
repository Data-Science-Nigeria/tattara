'use client';

import React from 'react';
import { ArrowLeft, User, Trash2, Mail, Calendar, Shield } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { userControllerFindAllOptions } from '@/client/@tanstack/react-query.gen';

interface UserProfilePageProps {
  params: {
    id: string;
  };
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
  const { data: usersData, isLoading } = useQuery({
    ...userControllerFindAllOptions({
      query: { page: 1, limit: 1000 }, // Get all users to find the specific one
    }),
  });

  interface Role {
    name: string;
    permissions?: Permission[];
  }

  interface Permission {
    name: string;
    description?: string;
  }

  interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isEmailVerified: boolean;
    createdAt: string;
    lastLoginAt?: string;
    roles?: Role[];
  }

  const user = (usersData as { data?: User[] })?.data?.find(
    (u: User) => u.id === params.id
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading user profile...</p>
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
      <div className="border-b border-gray-200 bg-white px-8 py-6">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/admin/user-profile"
            className="flex items-center gap-2 text-gray-600 transition-colors duration-200 hover:text-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Users
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-300">
                <User className="h-8 w-8 text-gray-600" />
              </div>
              <div>
                <div className="mb-1 flex items-center gap-3">
                  <h1 className="text-3xl font-semibold text-gray-800">
                    {user?.firstName} {user?.lastName}
                  </h1>
                  <StatusBadge isVerified={user?.isEmailVerified} />
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {user?.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(user?.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    {user?.roles?.[0]?.name || 'User'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-6 py-3 font-medium text-red-600 transition-colors duration-200 hover:bg-red-100">
            <Trash2 className="h-5 w-5" />
            Delete User
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* User Information */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-6 text-xl font-semibold text-gray-800">
                User Information
              </h2>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-800">
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

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Last Login
                  </label>
                  <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-800">
                    {user?.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Never'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Roles & Permissions */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-800">
                Roles & Permissions
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Assigned Roles
                  </label>
                  <div className="space-y-2">
                    {user?.roles && user.roles.length > 0 ? (
                      user.roles.map((role: Role, index: number) => (
                        <span
                          key={index}
                          className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                        >
                          {role.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">
                        No roles assigned
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Permissions
                  </label>
                  <div className="space-y-2">
                    {user?.roles &&
                    user.roles.flatMap((role: Role) => role.permissions || [])
                      .length > 0 ? (
                      user.roles
                        .flatMap((role: Role) => role.permissions || [])
                        .map((permission: Permission, index: number) => (
                          <span
                            key={index}
                            className="mr-2 mb-2 inline-block rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
                          >
                            {permission.name}
                          </span>
                        ))
                    ) : (
                      <span className="text-sm text-gray-500">
                        No specific permissions
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-800">
                Quick Actions
              </h3>

              <div className="space-y-3">
                <button className="w-full rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700">
                  Send Message
                </button>

                <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700">
                  Reset Password
                </button>

                <button className="w-full rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700">
                  Suspend Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
