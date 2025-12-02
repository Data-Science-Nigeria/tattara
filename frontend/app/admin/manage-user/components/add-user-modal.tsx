'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userControllerRegisterSingleUserMutation } from '@/client/@tanstack/react-query.gen';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated?: () => void;
}

export default function AddUserModal({
  isOpen,
  onClose,
  onUserCreated,
}: AddUserModalProps) {
  const queryClient = useQueryClient();
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    general: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const createUser = useMutation({
    ...userControllerRegisterSingleUserMutation(),
  });

  const validateField = (field: string, value: string) => {
    const trimmedValue = value.trim();

    switch (field) {
      case 'firstName':
        if (!trimmedValue) return 'First name is required';
        if (trimmedValue.length > 15)
          return 'First name must be at most 15 characters';
        if (!/^[a-zA-Z]+$/.test(trimmedValue))
          return 'Only letters allowed, no spaces';
        return '';
      case 'lastName':
        if (!trimmedValue) return 'Last name is required';
        if (trimmedValue.length > 15)
          return 'Last name must be at most 15 characters';
        if (!/^[a-zA-Z]+$/.test(trimmedValue))
          return 'Only letters allowed, no spaces';
        return '';
      case 'email':
        if (!trimmedValue) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue))
          return 'Invalid email';
        return '';
      case 'password':
        if (!trimmedValue) return 'Password is required';
        return '';
      default:
        return '';
    }
  };

  const handleCreateUser = async () => {
    setErrors({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      general: '',
    });

    // Validation
    const newErrors = {
      firstName: validateField('firstName', newUser.firstName),
      lastName: validateField('lastName', newUser.lastName),
      email: validateField('email', newUser.email),
      password: validateField('password', newUser.password),
      general: '',
    };

    if (Object.values(newErrors).some((error) => error)) {
      setErrors(newErrors);
      return;
    }

    try {
      await createUser.mutateAsync({
        body: {
          ...newUser,
          firstName: newUser.firstName.trim(),
          lastName: newUser.lastName.trim(),
          email: newUser.email.toLowerCase().trim(),
        },
      });

      toast.success('User created successfully!');
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'userControllerFindAll',
      });
      onUserCreated?.();
      onClose();
      setNewUser({ firstName: '', lastName: '', email: '', password: '' });
    } catch (error: unknown) {
      const errorMessage =
        (
          error as {
            response?: { data?: { message?: string } };
            message?: string;
          }
        )?.response?.data?.message ||
        (error as { message?: string })?.message ||
        'Failed to create user';
      setErrors({ ...errors, general: errorMessage });
      toast.error(errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="custom-scrollbar mx-2 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-4 sm:mx-4 sm:p-6">
        <div className="mb-3 flex items-start justify-between sm:mb-4">
          <div className="pr-2">
            <h2 className="text-lg font-semibold text-gray-800 sm:text-xl">
              Add New User
            </h2>
            <p className="text-xs text-gray-600 sm:text-sm">
              Create new users with these details
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <svg
              className="h-5 w-5 sm:h-6 sm:w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {errors.general && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 sm:mb-4 sm:p-3">
            <p className="text-xs text-red-600 sm:text-sm">{errors.general}</p>
          </div>
        )}

        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
              First Name
            </label>
            <input
              type="text"
              placeholder="Enter first name"
              value={newUser.firstName}
              onChange={(e) => {
                setNewUser({ ...newUser, firstName: e.target.value });
                if (errors.firstName) setErrors({ ...errors, firstName: '' });
              }}
              className={`w-full rounded-lg border px-2 py-2 text-sm focus:ring-2 focus:outline-none sm:px-3 ${
                errors.firstName
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-green-500'
              }`}
              required
            />
            {errors.firstName && (
              <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
              Last Name
            </label>
            <input
              type="text"
              placeholder="Enter last name"
              value={newUser.lastName}
              onChange={(e) => {
                setNewUser({ ...newUser, lastName: e.target.value });
                if (errors.lastName) setErrors({ ...errors, lastName: '' });
              }}
              className={`w-full rounded-lg border px-2 py-2 text-sm focus:ring-2 focus:outline-none sm:px-3 ${
                errors.lastName
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-green-500'
              }`}
              required
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter email address"
              value={newUser.email}
              onChange={(e) => {
                setNewUser({ ...newUser, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              className={`w-full rounded-lg border px-2 py-2 text-sm focus:ring-2 focus:outline-none sm:px-3 ${
                errors.email
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-green-500'
              }`}
              required
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={newUser.password}
                onChange={(e) => {
                  setNewUser({ ...newUser, password: e.target.value });
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                className={`w-full rounded-lg border px-2 py-2 pr-8 text-sm focus:ring-2 focus:outline-none sm:px-3 sm:pr-10 ${
                  errors.password
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-green-500'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-600 sm:right-3"
              >
                {showPassword ? (
                  <EyeOff size={18} className="sm:h-5 sm:w-5" />
                ) : (
                  <Eye size={18} className="sm:h-5 sm:w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password}</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:gap-3">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 sm:flex-1 sm:px-4"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateUser}
            disabled={createUser.isPending}
            className="w-full rounded-lg bg-green-600 px-3 py-2 text-sm text-white transition-colors hover:bg-green-700 disabled:opacity-50 sm:flex-1 sm:px-4"
          >
            {createUser.isPending ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}
