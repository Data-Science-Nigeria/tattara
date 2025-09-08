import { Computer, LogOut, PlusSquare, User, Users } from 'lucide-react';

export const sidebarItems = [
  {
    name: 'Overview',
    href: '/admin/overview',
    icon: Computer,
    alt: 'Overview icon',
  },
  {
    name: 'Profile',
    href: '/admin/profile',
    icon: User,
    alt: 'Profile ion',
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
];

export const logoutItem = {
  name: 'Log Out',
  href: '/logout',
  icon: LogOut,
  alt: 'Logout icon',
};
