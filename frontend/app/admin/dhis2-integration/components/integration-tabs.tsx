'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  integrationControllerGetProgramsOptions,
  integrationControllerGetDatasetsOptions,
  integrationControllerFetchSchemasOptions,
  integrationControllerGetOrgUnitsOptions,
} from '@/client/@tanstack/react-query.gen';
import { _Object } from '@/client/types.gen';

interface DataElement {
  id: string;
  name?: string;
  displayName?: string;
  valueType?: string;
}

interface DataSetElement {
  dataElement: DataElement;
}

interface ProgramStageDataElement {
  dataElement: DataElement;
}

interface ProgramStage {
  name?: string;
  displayName?: string;
  programStageDataElements?: ProgramStageDataElement[];
}

interface TrackedEntityAttribute {
  id: string;
  name: string;
}

interface DataItem {
  id: string;
  name?: string;
  displayName?: string;
  description?: string;
  parent?: {
    id: string;
    displayName: string;
  };
  children?: DataItem[];
  dataSetElements?: DataSetElement[];
  programStages?: ProgramStage[];
  trackedEntityAttributes?: TrackedEntityAttribute[];
}

interface Pager {
  pageCount: number;
  total: number;
}

interface ApiResponseWithPager {
  data?: {
    programs?: DataItem[];
    dataSets?: DataItem[];
    pager?: Pager;
  };
}

interface ApiResponse {
  data?:
    | DataItem[]
    | {
        programs?: DataItem[];
        dataSets?: DataItem[];
        pager?: Pager;
      };
}

interface IntegrationTabsProps {
  connectionId: string;
}

export default function IntegrationTabs({
  connectionId,
}: IntegrationTabsProps) {
  const [activeTab, setActiveTab] = useState('programs');
  const [selectedType, setSelectedType] = useState<'program' | 'dataset'>(
    'program'
  );
  const [selectedId, setSelectedId] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('');

  const { data: programs, isLoading: programsLoading } = useQuery({
    ...integrationControllerGetProgramsOptions({
      path: { connectionId },
      query: { page: 1, pageSize: 50 },
    }),
    enabled: activeTab === 'programs',
  });

  const { data: datasets, isLoading: datasetsLoading } = useQuery({
    ...integrationControllerGetDatasetsOptions({
      path: { connectionId },
      query: { page: 1, pageSize: 50 },
    }),
    enabled: activeTab === 'datasets',
  });

  const {
    data: schemas,
    isLoading: schemasLoading,
    error: schemasError,
  } = useQuery({
    ...integrationControllerFetchSchemasOptions({
      path: { connectionId },
      query: { type: selectedType as unknown as _Object, id: selectedId },
    }),
    enabled: activeTab === 'schemas' && !!selectedId,
    retry: false,
  });

  const {
    data: orgUnits,
    isLoading: orgUnitsLoading,
    error: orgUnitsError,
  } = useQuery({
    ...integrationControllerGetOrgUnitsOptions({
      path: { connectionId },
      query: { type: selectedType as unknown as _Object, id: selectedId },
    }),
    enabled: activeTab === 'orgunits' && !!selectedId,
    retry: false,
  });

  const tabs = [
    {
      id: 'programs',
      label: 'Programs',
      data: programs,
      loading: programsLoading,
    },
    {
      id: 'datasets',
      label: 'Datasets',
      data: datasets,
      loading: datasetsLoading,
    },
    {
      id: 'orgunits',
      label: 'Org Units',
      data: orgUnits,
      loading: orgUnitsLoading,
      error: orgUnitsError,
    },
    {
      id: 'schemas',
      label: 'Schemas',
      data: schemas,
      loading: schemasLoading,
      error: schemasError,
    },
  ];

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Tab Headers */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4 overflow-x-auto custom-scrollbar px-3 sm:space-x-8 sm:px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-1 py-3 text-xs font-medium whitespace-nowrap sm:py-4 sm:text-sm ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-3 sm:p-6">
        {activeTab === 'schemas' && (
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="w-full sm:w-auto">
              <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value as 'program' | 'dataset');
                  setSelectedId('');
                }}
                className="w-full rounded border border-gray-300 px-2 py-2 text-xs focus:border-green-500 focus:outline-none sm:w-auto sm:px-3 sm:text-sm"
              >
                <option value="program">Programs</option>
                <option value="dataset">Datasets</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                Select {selectedType === 'program' ? 'Program' : 'Dataset'}
              </label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full rounded border border-gray-300 px-2 py-2 text-xs focus:border-green-500 focus:outline-none sm:px-3 sm:text-sm"
              >
                <option value="">
                  Choose{' '}
                  {selectedType === 'program' ? 'a program' : 'a dataset'}...
                </option>
                {(() => {
                  const sourceData =
                    selectedType === 'program' ? programs : datasets;
                  const responseData = sourceData as ApiResponseWithPager;
                  const items =
                    responseData?.data && !Array.isArray(responseData.data)
                      ? responseData.data[
                          selectedType === 'program' ? 'programs' : 'dataSets'
                        ] || []
                      : [];
                  return items.map((item: DataItem) => (
                    <option key={item.id} value={item.id}>
                      {item.name || item.displayName}
                    </option>
                  ));
                })()}
              </select>
            </div>
          </div>
        )}
        {activeTab === 'orgunits' && (
          <div className="mb-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <div className="w-full sm:w-auto">
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                  Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value as 'program' | 'dataset');
                    setSelectedId('');
                  }}
                  className="w-full rounded border border-gray-300 px-2 py-2 text-xs focus:border-green-500 focus:outline-none sm:w-auto sm:px-3 sm:text-sm"
                >
                  <option value="program">Programs</option>
                  <option value="dataset">Datasets</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                  Select {selectedType === 'program' ? 'Program' : 'Dataset'}
                </label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-2 text-xs focus:border-green-500 focus:outline-none sm:px-3 sm:text-sm"
                >
                  <option value="">
                    Choose{' '}
                    {selectedType === 'program' ? 'a program' : 'a dataset'}...
                  </option>
                  {(() => {
                    const sourceData =
                      selectedType === 'program' ? programs : datasets;
                    const responseData = sourceData as ApiResponseWithPager;
                    const items =
                      responseData?.data && !Array.isArray(responseData.data)
                        ? responseData.data[
                            selectedType === 'program' ? 'programs' : 'dataSets'
                          ] || []
                        : [];
                    return items.map((item: DataItem) => (
                      <option key={item.id} value={item.id}>
                        {item.name || item.displayName}
                      </option>
                    ));
                  })()}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                  Select Parent Org Unit
                </label>
                <select
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-2 text-xs focus:border-green-500 focus:outline-none sm:px-3 sm:text-sm"
                >
                  <option value="">All Org Units</option>
                  <option value="SCsY0WF1kSr">Edo State</option>
                </select>
              </div>
              {selectedParentId && (
                <button
                  onClick={() => setSelectedParentId('')}
                  className="text-xs whitespace-nowrap text-gray-600 hover:text-gray-800 sm:text-sm"
                >
                  ← Back to All
                </button>
              )}
            </div>
          </div>
        )}
        {activeTabData?.loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-green-600"></div>
          </div>
        ) : activeTabData?.error ? (
          <div className="py-8 text-center">
            <p className="mb-2 text-red-600">Error loading {activeTab}</p>
            <div className="text-sm text-gray-500">
              <pre className="overflow-auto rounded bg-gray-100 p-2 text-left text-xs">
                {JSON.stringify(activeTabData.error, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div>
            <div className="space-y-3">
              {(() => {
                const responseData = activeTabData?.data as ApiResponse;
                let items: DataItem[] = [];
                let pager = null;

                if (responseData?.data) {
                  if (activeTab === 'programs') {
                    if (!Array.isArray(responseData.data)) {
                      items = responseData.data.programs || [];
                      pager = responseData.data.pager;
                    }
                  } else if (activeTab === 'datasets') {
                    if (!Array.isArray(responseData.data)) {
                      items = responseData.data.dataSets || [];
                      pager = responseData.data.pager;
                    }
                  } else if (activeTab === 'orgunits') {
                    const allItems = Array.isArray(responseData.data)
                      ? responseData.data
                      : [];
                    if (selectedParentId) {
                      items = allItems.filter(
                        (item) => item.parent?.id === selectedParentId
                      );
                    } else {
                      // Group by parent
                      const parents = new Map();
                      allItems.forEach((item) => {
                        const parentId = item.parent?.id || 'root';
                        if (!parents.has(parentId)) {
                          parents.set(parentId, {
                            id: parentId,
                            displayName: item.parent?.displayName || 'Root',
                            children: [],
                          });
                        }
                        parents.get(parentId).children.push(item);
                      });
                      items = Array.from(parents.values());
                    }
                    pager = null;
                  } else if (activeTab === 'schemas') {
                    if (
                      responseData.data &&
                      !Array.isArray(responseData.data)
                    ) {
                      // For schemas, we create a synthetic DataItem from the schema data
                      items = [
                        {
                          id: 'schema',
                          name: 'Schema Data',
                          displayName: 'Schema Data',
                          ...responseData.data,
                        } as DataItem,
                      ];
                    } else {
                      items = [];
                    }
                  }
                }

                return (
                  <>
                    {Array.isArray(items) && items.length > 0 ? (
                      items.map((item, index: number) => (
                        <div
                          key={index}
                          className="rounded border border-gray-200 p-2 sm:p-3"
                        >
                          {activeTab === 'orgunits' &&
                          !selectedParentId &&
                          item.children ? (
                            <>
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <h3 className="text-sm font-medium break-words sm:text-base">
                                  {item.displayName}
                                </h3>
                                <button
                                  onClick={() => setSelectedParentId(item.id)}
                                  className="text-xs whitespace-nowrap text-green-600 hover:text-green-800 sm:text-sm"
                                >
                                  View Children ({item.children.length})
                                </button>
                              </div>
                              <p className="text-xs break-all text-gray-400">
                                ID: {item.id}
                              </p>
                            </>
                          ) : (
                            <>
                              <h3 className="text-sm font-medium break-words sm:text-base">
                                {item.name ||
                                  item.displayName ||
                                  `Item ${index + 1}`}
                              </h3>
                              {item.description && (
                                <p className="text-xs break-words text-gray-500 sm:text-sm">
                                  {item.description}
                                </p>
                              )}
                              {item.id && (
                                <p className="text-xs break-all text-gray-400">
                                  ID: {item.id}
                                </p>
                              )}
                              {item.parent && (
                                <p className="text-xs break-words text-gray-500">
                                  Parent: {item.parent.displayName} (
                                  <span className="break-all">
                                    {item.parent.id}
                                  </span>
                                  )
                                </p>
                              )}
                            </>
                          )}
                          {item.dataSetElements && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-700 sm:text-sm">
                                Data Elements:
                              </p>
                              <ul className="mt-1 space-y-1">
                                {item.dataSetElements.map(
                                  (element, idx: number) => (
                                    <li
                                      key={idx}
                                      className="text-xs break-words text-gray-600 sm:text-sm"
                                    >
                                      • {element.dataElement.name}
                                      <span className="ml-2 text-xs break-all text-gray-400">
                                        ({element.dataElement.id})
                                      </span>
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                          {item.programStages && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-700 sm:text-sm">
                                Program Stages & Data Elements:
                              </p>
                              {item.programStages.map((stage, idx: number) => (
                                <div key={idx} className="mt-2 ml-1 sm:ml-2">
                                  <p className="text-xs font-medium break-words text-gray-600 sm:text-sm">
                                    Stage:{' '}
                                    {stage.displayName ||
                                      stage.name ||
                                      `Stage ${idx + 1}`}
                                  </p>
                                  {stage.programStageDataElements && (
                                    <ul className="mt-1 ml-2 space-y-1 sm:ml-4">
                                      {stage.programStageDataElements.map(
                                        (element, elemIdx: number) => (
                                          <li
                                            key={elemIdx}
                                            className="text-xs break-words text-gray-600 sm:text-sm"
                                          >
                                            •{' '}
                                            {element.dataElement.name ||
                                              element.dataElement.displayName}
                                            <span className="ml-1 text-xs break-all text-gray-400 sm:ml-2">
                                              ({element.dataElement.id}) -{' '}
                                              {element.dataElement.valueType}
                                            </span>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {item.trackedEntityAttributes && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-700 sm:text-sm">
                                Tracked Entity Attributes:
                              </p>
                              <ul className="mt-1 space-y-1">
                                {item.trackedEntityAttributes.map(
                                  (attr, idx: number) => (
                                    <li
                                      key={idx}
                                      className="text-xs break-words text-gray-600 sm:text-sm"
                                    >
                                      • {attr.name}
                                      <span className="ml-1 text-xs break-all text-gray-400 sm:ml-2">
                                        ({attr.id})
                                      </span>
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="py-8 text-center text-xs text-gray-500 sm:text-sm">
                        No {activeTab} found for this connection
                      </p>
                    )}

                    {pager && (pager as Pager).pageCount > 1 && (
                      <div className="mt-4 text-center">
                        <p className="mb-2 text-xs text-gray-600 sm:text-sm">
                          Showing {items.length} of {(pager as Pager).total}{' '}
                          items
                        </p>
                        <button className="rounded bg-green-600 px-3 py-2 text-xs text-white hover:bg-green-700 sm:px-4 sm:text-sm">
                          Load All {(pager as Pager).total} Items
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
