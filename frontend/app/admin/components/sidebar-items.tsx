import {
  Computer,
  Lock,
  LogOut,
  PlusSquare,
  User,
  UserCog,
  Users,
} from 'lucide-react';

// Initial admin sidebar (after signup)
export const dashboardSidebarItems = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: Computer,
    alt: 'Dashboard icon',
  },
  {
    name: 'Profile',
    href: `/admin/profile`,
    icon: User,
    alt: 'Program Profile icon',
  },
  {
    name: 'User Workflow',
    href: `/admin/user-workflow`,
    icon: UserCog,
    alt: 'User Workflow icon',
  },
  {
    name: 'Manage Users',
    href: `/admin/manage-users`,
    icon: Users,
    alt: 'User icon',
  },
  {
    name: 'DHIS2 Auth',
    href: '/admin/external-connection',
    icon: Lock,
    alt: 'DHIS2 Auth icon',
  },
];

// Program-specific sidebar (when program is selected)
export const getProgramSidebarItems = (programId: string) => [
  {
    name: 'Overview',
    href: `/admin/programs/${programId}/overview`,
    icon: Computer,
    alt: 'Overview icon',
  },
  {
    name: 'Create Workflow',
    href: `/admin/programs/${programId}/create-workflow`,
    icon: PlusSquare,
    alt: 'Workflow icon',
  },
];

// Helper function to determine which sidebar items to show
export const getSidebarItems = (pathname: string) => {
  // Check if we're in a program context using the new route structure
  const programMatch = pathname.match(/^\/admin\/programs\/([^/]+)/);

  if (programMatch) {
    const programId = programMatch[1];
    return getProgramSidebarItems(programId);
  }

  return dashboardSidebarItems;
};

// Legacy export for backward compatibility
export const sidebarItems = dashboardSidebarItems;

export const logoutItem = {
  name: 'Log Out',
  href: '/logout',
  icon: LogOut,
  alt: 'Logout icon',
};
