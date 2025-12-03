import { Computer, Lock, LogOut, PlusSquare, User, Users } from 'lucide-react';

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
    name: 'DHIS2 Auth',
    href: '/admin/external-connection',
    icon: Lock,
    alt: 'DHIS2 Auth icon',
  },
];

export const logoutItem = {
  name: 'Log Out',
  href: '/logout',
  icon: LogOut,
  alt: 'Logout icon',
};
