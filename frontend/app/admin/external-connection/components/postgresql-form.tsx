'use client';

import { useState } from 'react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PostgreSQLFormProps {
  host: string;
  setHost: (value: string) => void;
  port: string;
  setPort: (value: string) => void;
  database: string;
  setDatabase: (value: string) => void;
  username: string;
  setUsername: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  onTestConnection: () => void;
  isTestingConnection: boolean;
  connectionTested: boolean;
  testError?: string;
  name: string;
}

export default function PostgreSQLForm({
  host,
  setHost,
  port,
  setPort,
  database,
  setDatabase,
  username,
  setUsername,
  password,
  setPassword,
  onTestConnection,
  isTestingConnection,
  connectionTested,
  testError,
  name,
}: PostgreSQLFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      {/* PostgreSQL Configuration */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Host */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Host
          </label>
          <input
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="localhost"
            className="w-full rounded-lg border border-[#D2DDF5] bg-white px-3 py-2 focus:border-[#008647] focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
        </div>

        {/* Port */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Port
          </label>
          <input
            type="number"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            placeholder="5432"
            className="w-full rounded-lg border border-[#D2DDF5] bg-white px-3 py-2 focus:border-[#008647] focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
        </div>

        {/* Database */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Database
          </label>
          <input
            type="text"
            value={database}
            onChange={(e) => setDatabase(e.target.value)}
            placeholder="database_name"
            className="w-full rounded-lg border border-[#D2DDF5] bg-white px-3 py-2 focus:border-[#008647] focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
        </div>

        {/* Username */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            className="w-full rounded-lg border border-[#D2DDF5] bg-white px-3 py-2 focus:border-[#008647] focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
        </div>

        {/* Password */}
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full rounded-lg border border-[#D2DDF5] bg-white px-3 py-2 pr-10 focus:border-[#008647] focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Test Connection Section */}
      <div className="rounded-lg border border-[#D2DDF5] bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Test Connection</p>
            <p className="text-xs text-gray-500">
              Verify your credentials before creating
            </p>
          </div>
          <Button
            onClick={onTestConnection}
            disabled={
              !name ||
              !host ||
              !database ||
              !username ||
              !password ||
              isTestingConnection
            }
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isTestingConnection && (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isTestingConnection ? 'Testing...' : 'Test Connection'}
          </Button>
        </div>
        {connectionTested && (
          <div className="mt-3 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <p className="text-sm text-green-600">Connection successful!</p>
          </div>
        )}
        {testError && (
          <div className="mt-3 flex items-start gap-2">
            <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-red-500"></div>
            <p className="flex-1 text-sm break-all text-red-600">{testError}</p>
          </div>
        )}
      </div>
    </>
  );
}
