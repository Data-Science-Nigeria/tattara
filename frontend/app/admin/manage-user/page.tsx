'use client';

import React, { useState } from 'react';

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

  const filteredUsers = usersData.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Manage User</h1>
          <p className="text-gray-600">View, Edit, Suspend and Delete Users</p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-lg bg-green-50 px-4 py-2 font-medium text-green-700">
            Add User
          </button>
          <button className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white">
            Upload Users
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col items-start rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Total Users</p>
          <h2 className="text-2xl font-semibold">{usersData.length}</h2>
        </div>
        <div className="flex flex-col items-start rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Active Users</p>
          <h2 className="text-2xl font-semibold">
            {usersData.filter((u) => u.status === 'Active').length}
          </h2>
        </div>
        <div className="flex flex-col items-start rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Data Records</p>
          <h2 className="text-2xl font-semibold">{18}</h2>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            +
          </div>
          <div>
            <p className="font-medium text-gray-800">Add User</p>
            <p className="text-sm text-gray-500">
              Create an individual account for a new user
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            ⬆
          </div>
          <div>
            <p className="font-medium text-gray-800">User Upload</p>
            <p className="text-sm text-gray-500">
              Create multiple accounts for different users
            </p>
          </div>
        </div>
      </div>

      {/* Search & Controls */}
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border px-4 py-2 sm:w-1/3"
        />
        <div className="flex gap-2">
          <button className="rounded-lg border px-4 py-2">Filter</button>
          <button className="rounded-lg border px-4 py-2">Export</button>
        </div>
      </div>

      {/* User Table */}
      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-500">Name</th>
              <th className="px-6 py-3 font-medium text-gray-500">Email</th>
              <th className="px-6 py-3 font-medium text-gray-500">Status</th>
              <th className="px-6 py-3 font-medium text-gray-500">
                Created By
              </th>
              <th className="px-6 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3">{user.name}</td>
                <td className="px-6 py-3">{user.email}</td>
                <td className="px-6 py-3">
                  <StatusBadge status={user.status} />
                </td>
                <td className="px-6 py-3">{user.createdAt}</td>
                <td className="px-6 py-3">•••</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
