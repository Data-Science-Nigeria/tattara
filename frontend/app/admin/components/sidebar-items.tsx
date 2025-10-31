import {
  Computer,
  Lock,
  LogOut,
  PlusSquare,
  User,
  Users,
  Database,
} from 'lucide-react';

export const sidebarItems = [
  {
    name: 'Overview',
    href: '/admin/overview',
    icon: Computer,
    alt: 'Overview icon',
  },
  {
    name: 'User Profiles',
    href: '/admin/user-profile',
    icon: User,
    alt: 'User Profiles icon',
  },
  {
    name: 'Create Workflow',
    href: '/admin/create-workflow',
    icon: PlusSquare,
    alt: 'Workflow icon',
  },
  {
    name: 'Manage User',
    href: '/admin/manage-user',
    icon: Users,
    alt: 'User icon',
  },
  {
    name: 'External Connection',
    href: '/admin/external-connection',
    icon: Lock,
    alt: 'External Connection icon',
  },
  {
    name: 'DHIS2 Integration',
    href: '/admin/dhis2-integration',
    icon: Database,
    alt: 'DHIS2 Integration icon',
  },
];

export const logoutItem = {
  name: 'Log Out',
  href: '/logout',
  icon: LogOut,
  alt: 'Logout icon',
};
