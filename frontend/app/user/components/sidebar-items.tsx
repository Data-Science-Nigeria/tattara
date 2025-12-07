import {
  Computer,
  LogOut,
  User,
  Headphones,
  // Database,
  ClipboardList,
} from 'lucide-react';

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
  /* {
    name: 'Data Entry',
    href: '/user/data-entry',
    icon: Database,
    alt: 'Data Entry icon',
  }, */
  {
    name: 'My Submissions',
    href: '/user/my-submissions',
    icon: ClipboardList,
    alt: 'My Submissions icon',
  },
  {
    name: 'Contact Admin',
    href: '/user/contact-admin',
    icon: Headphones,
    alt: 'User icon',
  },
];

export const logoutItem = {
  name: 'Log Out',
  href: '/logout',
  icon: LogOut,
  alt: 'Logout icon',
};
