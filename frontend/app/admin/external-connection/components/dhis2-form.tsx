'use client';

import { useState } from 'react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DHIS2FormProps {
  baseUrl: string;
  setBaseUrl: (value: string) => void;
  pat: string;
  setPat: (value: string) => void;
  onTestConnection: () => void;
  isTestingConnection: boolean;
  connectionTested: boolean;
  testError?: string;
  name: string;
}

export default function DHIS2Form({
  baseUrl,
  setBaseUrl,
  pat,
  setPat,
  onTestConnection,
  isTestingConnection,
  connectionTested,
  testError,
  name,
}: DHIS2FormProps) {
  const [showToken, setShowToken] = useState(false);

  return (
    <>
      {/* Base URL and Personal Access Token */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Base URL */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Base URL
          </label>
          <input
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://tattara.org.ng"
            className="w-full rounded-lg border border-[#D2DDF5] bg-white px-3 py-2 focus:border-[#008647] focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
        </div>

        {/* Personal Access Token */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Personal Access Token (PAT)
          </label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              placeholder="Enter personal access token"
              className="w-full rounded-lg border border-[#D2DDF5] bg-white px-3 py-2 pr-10 focus:border-[#008647] focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showToken ? (
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
            disabled={!name || !pat || !baseUrl || isTestingConnection}
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
