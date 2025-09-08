'use client';
import {
  ChevronDown,
  Download,
  Filter,
  PencilIcon,
  Search,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Stat, StatsCard } from '../components/stat-card';
import { UserTable } from '../components/table';

export default function Card() {
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(1);
  const stats: Stat[] = [
    {
      title: 'Active Users',
      description: 'All active users under this program',
      icon: '/profile-2user.svg',
      value: 12,
    },
    {
      title: 'Completed Workflows',
      description: 'Workflows completed by assigned users',
      icon: '/profile-2user.svg',
      value: 8,
    },
  ];
  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h1 className="font-poppins text-2xl font-bold">
                Child Surveillance
              </h1>
              <p>Manage, Edit and Delete Program</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 rounded-lg border border-[#DB363B] bg-[#FFF5F5] px-6 py-3 text-sm font-medium text-[#DB363B]">
                <Trash2 />
                Delete Program
              </button>
              <button className="font-poppins flex items-center gap-2 rounded-lg bg-[#008647] px-6 py-3 text-sm font-medium text-white">
                <PencilIcon size={20} />
                Edit Program
              </button>
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {stats.map((stat, index) => (
            <StatsCard key={index} stat={stat} />
          ))}
        </div>
        <div className="mb-6 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="relative max-w-md flex-1 items-center justify-center">
            <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full items-center rounded-lg border-2 border-[#BAC7DF] py-3 pr-4 pl-12 text-white placeholder-gray-400"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[#A4B1CA]">
              <span>Showing:</span>
              <div className="relative gap-2 rounded-md border border-[#BAC7DF] bg-white px-2 py-2 text-black">
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                >
                  <option>10</option>
                </select>
                <ChevronDown className="absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 transform" />
              </div>
            </div>
          </div>
          <div className="flex flex-row gap-4">
            <button className="flex items-center gap-2 rounded-md border border-[#BAC7DF] bg-[#DBDCEA] px-3 py-3 text-sm text-[#65738B]">
              <Filter size={18} />
              Filter
            </button>
            <button className="flex items-center gap-2 rounded-md border border-[#BAC7DF] bg-[#DBDCEA] px-3 py-3 text-sm text-[#65738B]">
              <Download size={18} />
              Export
              <ChevronDown size={18} />
            </button>
          </div>
        </div>
        <UserTable
          searchQuery={''}
          currentPage={0}
          resultsPerPage={0}
          selectedDomain={''}
          filteredUsers={[]}
        />
      </div>
    </div>
  );
}
