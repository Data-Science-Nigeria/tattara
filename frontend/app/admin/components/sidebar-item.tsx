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
  return (
    <div className="items-center justify-center border-b px-4 py-3">
      <Link
        href={href}
        className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm text-gray-500 hover:bg-[#00A859] hover:text-white lg:text-base ${pathname === href && 'w-[215px] bg-[#00A859] text-white'}`}
        onClick={onClick}
      >
        <Icon size={24} />
        <span>{name}</span>
      </Link>
    </div>
  );
};
