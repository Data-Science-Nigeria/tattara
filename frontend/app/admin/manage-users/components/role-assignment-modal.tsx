'use client';

import { useState } from 'react';
import { X, Shield, User } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { userControllerAssignRoleMutation } from '@/client/@tanstack/react-query.gen';
import { toast } from 'sonner';

interface RoleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    roles: string[];
  };
  onRoleChanged: () => void;
}

export default function RoleAssignmentModal({
  isOpen,
  onClose,
  user,
  onRoleChanged,
}: RoleAssignmentModalProps) {
  const currentRole = user.roles?.[0] || 'user';
  const targetRole = currentRole === 'user' ? 'admin' : 'user';

  const assignRoleMutation = useMutation({
    ...userControllerAssignRoleMutation(),
    onSuccess: () => {
      toast.success('Role updated successfully');
      onRoleChanged();
      onClose();
    },
    onError: (error) => {
      console.error('Failed to assign role:', error);
      toast.error('Failed to update role');
    },
  });

  const handleAssignRole = () => {
    assignRoleMutation.mutate({
      path: { id: user.id, roleName: targetRole },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Change Role</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="mb-4 text-sm text-gray-600">
            Change{' '}
            <strong>
              {user.firstName} {user.lastName}
            </strong>{' '}
            from <strong>{currentRole}</strong> to <strong>{targetRole}</strong>
            ?
          </p>

          <div className="rounded-lg border bg-gray-50 p-3">
            <div className="flex items-center gap-3">
              {targetRole === 'admin' ? (
                <Shield className="h-5 w-5 text-red-500" />
              ) : (
                <User className="h-5 w-5 text-blue-500" />
              )}
              <div>
                <div className="font-medium capitalize">{targetRole}</div>
                <div className="text-sm text-gray-500">
                  {targetRole === 'admin'
                    ? 'Full administrative access'
                    : 'Data collector with limited access'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssignRole}
            disabled={assignRoleMutation.isPending}
            className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {assignRoleMutation.isPending
              ? 'Updating...'
              : `Change to ${targetRole}`}
          </button>
        </div>
      </div>
    </div>
  );
}
