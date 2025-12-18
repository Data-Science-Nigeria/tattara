'use client';

import { Database, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import type { ExternalConnection } from '@/client/types.gen';
import DeleteConnectionModal from './delete-connection-modal';

interface ConnectionCardProps {
  connection: ExternalConnection;
  onEdit: (connection: ExternalConnection) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export default function ConnectionCard({
  connection,
  onEdit,
  onDelete,
  isDeleting = false,
}: ConnectionCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div className="rounded-lg border border-[#D2DDF5] bg-white p-3 sm:p-4">
      <div className="space-y-2 sm:flex sm:items-center sm:justify-between sm:gap-3 sm:space-y-0">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex-shrink-0 rounded-lg bg-blue-50 p-1.5">
            {connection.type === 'dhis2' ? (
              <Image
                src="/dhis2-logo.svg"
                alt="DHIS2"
                width={20}
                height={20}
                className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5"
              />
            ) : connection.type === 'postgres' ? (
              <Image
                src="/postgresql-logo.svg"
                alt="PostgreSQL"
                width={20}
                height={20}
                className="h-4 w-4 sm:h-5 sm:w-5"
              />
            ) : (
              <Database className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
              {connection.name}
            </h3>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                {connection.type.toUpperCase()}
              </span>
            </div>
            <div className="mt-1 truncate text-xs text-gray-600 sm:text-sm">
              {connection.type === 'dhis2'
                ? (connection.configuration as { baseUrl?: string })?.baseUrl ||
                  'No URL configured'
                : (connection.configuration as { host?: string })?.host ||
                  'No host configured'}
            </div>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center justify-between gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
              connection.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {connection.isActive ? 'Active' : 'Inactive'}
          </span>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {showMenu && (
              <div className="absolute top-8 right-0 z-50 w-32 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  onClick={() => {
                    onEdit(connection);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(true);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <DeleteConnectionModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          onDelete(connection.id);
          setShowDeleteModal(false);
        }}
        connectionName={connection.name}
        isDeleting={isDeleting}
      />
    </div>
  );
}
