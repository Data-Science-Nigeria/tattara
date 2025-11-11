'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pencil, X } from 'lucide-react';
import { authControllerGetProfileOptions } from '../../../client/@tanstack/react-query.gen';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../components/ui/tooltip';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  gender?: 'Male' | 'Female';
}

export default function ProfilePage() {
  const [isEditingGender, setIsEditingGender] = useState(false);
  const [genderValue, setGenderValue] = useState('');

  interface ProfileResponse {
    data: UserProfile;
  }

  const { data } = useQuery(authControllerGetProfileOptions());
  const profile = (data as ProfileResponse)?.data;

  const handleEditGender = () => {
    setGenderValue(profile?.gender || '');
    setIsEditingGender(true);
  };

  const handleCancelGender = () => {
    setIsEditingGender(false);
    setGenderValue('');
  };

  const handleSaveGender = () => {
    setIsEditingGender(false);
  };

  const fullName = profile
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
    : '';

  return (
    <div className="px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-lg font-semibold text-gray-800 sm:mb-6 sm:text-xl lg:text-2xl">
          Profile
        </h1>

        <div className="rounded-lg bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6 lg:p-8">
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="absolute -right-1 -bottom-1 rounded-full bg-white p-1 text-gray-600 shadow-md hover:bg-gray-50 hover:text-gray-700">
                    <Pencil className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Upload Picture</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Profile Info */}
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h2 className="mb-1 truncate text-lg font-semibold text-gray-900 sm:text-xl lg:text-2xl">
                {fullName || 'User Name'}
              </h2>
              <p className="text-sm break-all text-gray-600 sm:text-base">
                {profile?.email || 'user@email.com'}
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

              {/* Gender */}
              <div className="sm:col-span-2">
                <div className="mb-1 flex items-center gap-2">
                  <h4 className="text-sm font-medium text-gray-900 sm:text-base">
                    Gender
                  </h4>
                  {!isEditingGender ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleEditGender}
                          className="rounded p-1 text-gray-600 hover:bg-gray-50 hover:text-gray-700"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleSaveGender}
                        className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 sm:px-3 sm:text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelGender}
                        className="rounded bg-red-600 p-1 text-white hover:bg-red-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
                {!isEditingGender ? (
                  <p className="text-sm text-gray-600 sm:text-base">
                    {profile?.gender || 'Not set'}
                  </p>
                ) : (
                  <select
                    value={genderValue}
                    onChange={(e) =>
                      setGenderValue(e.target.value as 'Male' | 'Female')
                    }
                    className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none sm:text-base"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
