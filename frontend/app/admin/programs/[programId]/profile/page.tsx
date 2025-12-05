'use client';

import { useQuery } from '@tanstack/react-query';
import { authControllerGetProfileOptions } from '@/client/@tanstack/react-query.gen';

interface AdminProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function AdminProfilePage() {
  interface ProfileResponse {
    data: AdminProfile;
  }

  const { data } = useQuery(authControllerGetProfileOptions());
  const profile = (data as ProfileResponse)?.data;

  const fullName = profile
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
    : '';

  return (
    <div className="relative p-3 sm:p-6">
      <div className="w-full">
        <div className="mb-6 px-0 sm:mb-8 sm:px-2">
          <h1 className="text-xl font-semibold text-gray-800 sm:text-2xl">
            Profile
          </h1>
        </div>

        <div className="max-w-4xl rounded-lg border border-[#D2DDF5] bg-white p-4 sm:rounded-2xl sm:p-6 lg:p-8">
          {/* Profile Header */}
          <div className="mb-6 flex flex-col items-center gap-4 border-b border-gray-200 pb-6 sm:mb-8 sm:flex-row sm:items-start sm:gap-6 sm:pb-8">
            {/* Profile Avatar */}
            <div className="relative">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 sm:h-24 sm:w-24">
                <svg
                  className="h-10 w-10 text-white sm:h-12 sm:w-12"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            </div>

            {/* Profile Info */}
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h2 className="mb-1 truncate text-lg font-semibold text-gray-900 sm:text-xl lg:text-2xl">
                {fullName || 'Admin Name'}
              </h2>
              <p className="text-sm break-all text-gray-600 sm:text-base">
                {profile?.email || 'admin@email.com'}
              </p>
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="relative">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base font-semibold text-gray-900 sm:text-lg lg:text-xl">
                Personal Information
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
              {/* First Name */}
              <div>
                <h4 className="mb-1 text-sm font-medium text-gray-900 sm:text-base">
                  First Name
                </h4>
                <p className="text-sm text-gray-600 sm:text-base">
                  {profile?.firstName || 'Not set'}
                </p>
              </div>

              {/* Last Name */}
              <div>
                <h4 className="mb-1 text-sm font-medium text-gray-900 sm:text-base">
                  Last Name
                </h4>
                <p className="text-sm text-gray-600 sm:text-base">
                  {profile?.lastName || 'Not set'}
                </p>
              </div>

              {/* Email */}
              <div>
                <h4 className="mb-1 text-sm font-medium text-gray-900 sm:text-base">
                  Email
                </h4>
                <p className="text-sm text-gray-600 sm:text-base">
                  {profile?.email || 'Not set'}
                </p>
              </div>

              {/* Role */}
              <div>
                <h4 className="mb-1 text-sm font-medium text-gray-900 sm:text-base">
                  Role
                </h4>
                <p className="text-sm text-gray-600 sm:text-base">Admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
