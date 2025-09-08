'use client';
import {
  TableBody,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from '../../../../components/ui/table';

interface UserData {
  id: number;
  name: string;
  assignedProgram: string;
  completedOn: string | null;
  status: 'Pending' | 'Completed';
  action: string | null;
}

interface UserTableProps {
  searchQuery: string;
  currentPage: number;
  resultsPerPage: number;
  selectedDate?: Date | [Date, Date] | null;
  selectedDomain: string;
  filteredUsers: UserData[];
}
export function UserTable({ filteredUsers }: UserTableProps) {
  return (
    <div className="rounded-md border">
      <Table className="w-full rounded-md bg-white p-6">
        <TableHeader className="bg-[#F2F3FF]">
          <TableRow className="">
            <TableHead className="px-6 py-4 text-left font-semibold text-gray-700">
              Name
            </TableHead>
            <TableHead className="px-6 py-4 text-left font-semibold text-gray-700">
              Assigned Program
            </TableHead>
            <TableHead className="px-6 py-4 text-left font-semibold text-gray-700">
              CompletedOn
            </TableHead>
            <TableHead className="px-6 py-4 text-left font-semibold text-gray-700">
              Status
            </TableHead>
            <TableHead className="px-6 py-4 text-left font-semibold text-gray-700">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="px-6 py-4 text-gray-700">
                {user.name}
              </TableCell>
              <TableCell className="px-6 py-4 text-gray-700">
                {user.assignedProgram}
              </TableCell>
              <TableCell className="px-6 py-4 text-gray-700">
                {user.completedOn}
              </TableCell>
              <TableCell className="px-6 py-4 text-gray-700">
                {user.status}
              </TableCell>
              <TableCell className="px-6 py-4 text-gray-700">
                {user.action}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
