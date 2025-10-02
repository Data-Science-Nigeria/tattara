'use client';

import React from 'react';
import UserTable from '../components/user-table';

export default function CreateWorkflow() {

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Create Workflow</h1>
          <p className="text-gray-600">Select users to create workflow assignments</p>
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
    </div>
  );
}
