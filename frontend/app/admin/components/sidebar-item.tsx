import { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type SidebarItemProps = {
  icon: LucideIcon;
  name: string;
  href: string;
  isActive?: boolean;
  onClick?: () => void;
};

export const SidebarItem = ({
  name,
  icon: Icon,
  href,
  onClick,
}: SidebarItemProps) => {
  const pathname = usePathname();

  const isActive = () => {
    // For dashboard, match exact path and sub-routes
    if (href === '/admin/dashboard') {
      return pathname === href || pathname.startsWith('/admin/dashboard/');
    }

    // For external-connection, match exact path and sub-routes
    if (href === '/admin/external-connection') {
      return (
        pathname === href || pathname.startsWith('/admin/external-connection/')
      );
    }

    // For workflows, match exact path and sub-routes (including /map, /test, /edit)
    if (href === '/admin/workflows') {
      return pathname === href || pathname.startsWith('/admin/workflows/');
    }

    // For program-specific routes, match the base path
    if (href.includes('/admin/programs/')) {
      return pathname === href || pathname.startsWith(href + '/');
    }

    // For other routes, exact match
    return pathname === href;
  };

  return (
    <div className="items-center justify-center border-b px-2 py-2">
      <Link
        href={href}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-[#00A859] hover:text-white ${isActive() && 'bg-[#00A859] text-white'}`}
        onClick={onClick}
      >
        <Icon size={18} />
        <span>{name}</span>
      </Link>
    </div>
  );
};
