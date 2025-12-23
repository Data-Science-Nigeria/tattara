'use client';

import DHIS2Form from './dhis2-form';
import PostgreSQLForm from './postgresql-form';

interface FormError {
  message: string | string[];
}

interface EditFormModalProps {
  isOpen: boolean;
  connectionType: 'dhis2' | 'postgres' | 'mysql';
  name: string;
  setName: (name: string) => void;
  // DHIS2 fields
  baseUrl?: string;
  setBaseUrl?: (baseUrl: string) => void;
  pat?: string;
  setPat?: (pat: string) => void;
  // PostgreSQL fields
  host?: string;
  setHost?: (host: string) => void;
  port?: string;
  setPort?: (port: string) => void;
  database?: string;
  setDatabase?: (database: string) => void;
  username?: string;
  setUsername?: (username: string) => void;
  password?: string;
  setPassword?: (password: string) => void;
  ssl?: boolean;
  setSsl?: (ssl: boolean) => void;
  client?: string;
  setClient?: (client: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onTestConnection: () => void;
  isLoading: boolean;
  isTestingConnection: boolean;
  connectionTested: boolean;
  testError?: string;
  error?: FormError;
}

export default function EditFormModal({
  isOpen,
  connectionType,
  name,
  setName,
  baseUrl = '',
  setBaseUrl = () => {},
  pat = '',
  setPat = () => {},
  host = '',
  setHost = () => {},
  port = '5432',
  setPort = () => {},
  database = '',
  setDatabase = () => {},
  username = '',
  setUsername = () => {},
  password = '',
  setPassword = () => {},
  ssl = false,
  setSsl = () => {},
  client = 'pg',
  setClient = () => {},
  onSubmit,
  onCancel,
  onTestConnection,
  isLoading,
  isTestingConnection,
  connectionTested,
  testError,
  error,
}: EditFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-4 sm:p-6">
        <h2 className="mb-3 text-lg font-semibold sm:mb-4 sm:text-xl">
          Edit Connection
        </h2>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
              Connection Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-2 text-sm focus:border-green-500 focus:outline-none sm:px-3"
              placeholder="Enter connection name"
            />
          </div>

          {connectionType === 'dhis2' ? (
            <DHIS2Form
              baseUrl={baseUrl}
              setBaseUrl={setBaseUrl}
              pat={pat}
              setPat={setPat}
              onTestConnection={onTestConnection}
              isTestingConnection={isTestingConnection}
              connectionTested={connectionTested}
              testError={testError}
              name={name}
            />
          ) : (
            <PostgreSQLForm
              host={host}
              setHost={setHost}
              port={port}
              setPort={setPort}
              database={database}
              setDatabase={setDatabase}
              username={username}
              setUsername={setUsername}
              password={password}
              setPassword={setPassword}
              ssl={ssl}
              setSsl={setSsl}
              client={client}
              setClient={setClient}
              onTestConnection={onTestConnection}
              isTestingConnection={isTestingConnection}
              connectionTested={connectionTested}
              testError={testError}
              name={name}
              isEditMode={true}
            />
          )}
        </div>

        {error && (
          <div className="mt-3 rounded border border-red-200 bg-red-50 p-2 sm:mt-4 sm:p-3">
            <p className="mb-1 text-xs font-medium text-red-600 sm:text-sm">
              Error updating connection:
            </p>
            {Array.isArray(error.message) ? (
              <ul className="list-inside list-disc space-y-1 text-xs text-red-600 sm:text-sm">
                {error.message.map((msg: string, index: number) => (
                  <li key={index}>{msg}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-red-600 sm:text-sm">
                {error.message || 'An error occurred'}
              </p>
            )}
          </div>
        )}
        <div className="mt-4 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:justify-end sm:gap-3">
          <button
            onClick={onCancel}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 sm:w-auto sm:border-0 sm:px-4"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={
              !name ||
              (connectionType === 'dhis2'
                ? !pat || !baseUrl
                : !host || !database || !username || !password) ||
              !connectionTested ||
              isLoading
            }
            className="flex w-full items-center justify-center gap-2 rounded bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50 sm:w-auto sm:px-4"
          >
            {isLoading && (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent sm:h-4 sm:w-4"></div>
            )}
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
