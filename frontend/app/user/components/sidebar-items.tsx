import { Computer, LogOut, PlusSquare, User, Users } from 'lucide-react';

export const sidebarItems = [
  {
    name: 'Overview',
    href: '/user/overview',
    icon: Computer,
    alt: 'Overview icon',
  },
  {
    name: 'Profile',
    href: '/user/profile',
    icon: User,
    alt: 'Profile icon',
  },
  {
    name: 'Data Entry',
    href: '/user/data-entry',
    icon: PlusSquare,
    alt: 'Workflow icon',
  },
  {
    name: 'Contact Admin',
    href: '/user/contact-admin',
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
