'use client';

import React, { useState } from 'react';
import { PasswordInput } from '../../auth/components/password-input';
import UserTable from '../components/user-table';

type UserStatus = 'Active' | 'Pending' | 'Suspended';

interface User {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  createdAt: string;
}

const usersData: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'johndoe@email.com',
    status: 'Pending',
    createdAt: '22/04/2025, 12:09pm',
  },
  {
    id: '2',
    name: 'Abeni Coker',
    email: 'abenicoker@email.com',
    status: 'Active',
    createdAt: '22/04/2025, 12:09pm',
  },
  {
    id: '3',
    name: 'Dani Leigh',
    email: 'danileigh@email.com',
    status: 'Suspended',
    createdAt: '22/04/2025, 12:09pm',
  },
  // Add more users
];

const StatusBadge = ({ status }: { status: UserStatus }) => {
  const styles: Record<UserStatus, string> = {
    Active: 'bg-green-100 text-green-700',
    Pending: 'bg-orange-100 text-orange-700',
    Suspended: 'bg-red-100 text-red-700',
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
};

export default function ManageUsers() {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadDropdown, setShowUploadDropdown] = useState(false);
  const [uploadDropdownCoords, setUploadDropdownCoords] = useState({ top: 0, left: 0, width: 0 });
  const [newUser, setNewUser] = useState({ name: '', email: '' });

  const handleUploadDropdownClick = (event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const dropdownWidth = rect.width + 200;
    setUploadDropdownCoords({
      top: rect.bottom + 8,
      left: rect.right - dropdownWidth,
      width: dropdownWidth
    });
    setShowUploadDropdown(!showUploadDropdown);
  };



  const handleCreateUser = () => {
    // Handle user creation logic here
    console.log('Creating user:', newUser);
    setShowAddModal(false);
    setNewUser({ name: '', email: '' });
  };

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Manage User</h1>
          <p className="text-gray-600">View, Edit, Suspend and Delete Users</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg border-2 border-green-800 bg-white px-6 py-2 font-medium text-green-800 hover:bg-green-800 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            Add User
          </button>
          <div className="relative">
            <button 
              onClick={handleUploadDropdownClick}
              className="flex items-center gap-2 rounded-lg bg-green-800 px-6 py-2 font-medium text-white hover:bg-green-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Users
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showUploadDropdown && (
              <div 
                className="fixed bg-white rounded-lg shadow-lg border z-50"
                style={{
                  top: `${uploadDropdownCoords.top}px`,
                  left: `${uploadDropdownCoords.left}px`,
                  width: `${uploadDropdownCoords.width}px`
                }}
              >
                <div>
                  <button className="w-full px-4 py-3 text-left flex items-center gap-3 text-gray-600 hover:bg-green-800 hover:text-white rounded-t-lg">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">Download Template</p>
                      <p className="text-xs opacity-75 hidden sm:block">Get the CSV template with the required columns</p>
                    </div>
                  </button>
                  
                  <button className="w-full px-4 py-3 text-left flex items-center gap-3 text-gray-600 hover:bg-green-800 hover:text-white rounded-b-lg">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 11l3-3m0 0l3 3m-3-3v8" />
                    </svg>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">Upload CSV File</p>
                      <p className="text-xs opacity-75 hidden sm:block">Upload your completed CSV file for review</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="relative rounded-lg bg-white p-4 shadow">
          <div className="absolute top-3 right-3 p-2 bg-green-100 rounded-full">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Users</p>
            <h2 className="text-2xl font-semibold">{usersData.length}</h2>
            <p className="text-xs text-gray-400">All registered users under here</p>
          </div>
        </div>
        <div className="relative rounded-lg bg-white p-4 shadow">
          <div className="absolute top-3 right-3 p-2 bg-green-100 rounded-full">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Users</p>
            <h2 className="text-2xl font-semibold">
              {usersData.filter((u) => u.status === 'Active').length}
            </h2>
            <p className="text-xs text-gray-400">All active users under here</p>
          </div>
        </div>
        <div className="relative rounded-lg bg-white p-4 shadow">
          <div className="absolute top-3 right-3 p-2 bg-green-100 rounded-full">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Data Records</p>
            <h2 className="text-2xl font-semibold">{18}</h2>
            <p className="text-xs text-gray-400">Total collected data under here</p>
          </div>
        </div>
      </div>

      {/* User Table */}
      <UserTable data={[
        { name: 'Alice Johnson', email: 'alice@example.com', status: 'Active', createdBy: '2024-01-15' },
        { name: 'Bob Smith', email: 'bob@example.com', status: 'Pending', createdBy: '2024-01-14' },
        { name: 'Carol Davis', email: 'carol@example.com', status: 'Suspended', createdBy: '2024-01-13' },
        { name: 'Daniel Wilson', email: 'daniel@example.com', status: 'Active', createdBy: '2024-01-12' },
        { name: 'Eva Martinez', email: 'eva@example.com', status: 'Pending', createdBy: '2024-01-11' }
      ]} />

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(12,16,20,0.88)] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Add New User</h2>
                <p className="text-gray-600 text-sm">Create new users with these details</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="Enter your Name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="Enter your Email Address"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <PasswordInput 
                  label="Default Password"
                  placeholder="User 123!"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateUser}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
