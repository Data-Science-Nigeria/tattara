'use client';

import Logo from './logo';
import Link from 'next/link';
import { Button } from '../../components/ui/button';
import { MobileNav } from './mobile-nav';
import { useAuthStore } from '../store/use-auth-store';
import { usePathname } from 'next/navigation';

const Header = () => {
  const { auth } = useAuthStore();
  const pathname = usePathname();
  const isAdmin =
    auth?.roles?.includes('admin') || auth?.roles?.includes('super-admin');

  return (
    <header className="mb-8 flex items-center justify-between bg-white px-8 py-4">
      <div className="flex items-center space-x-2">
        <Logo className="h-10" />
      </div>
      <div className="flex items-center space-x-4">
        <div className="hidden items-center space-x-4 md:flex">
          {auth?.token && (
            <>
              {isAdmin ? (
                <Link href="/admin/dashboard">
                  <Button
                    className={`px-6 transition-colors hover:bg-transparent hover:text-[#008647] ${
                      pathname.startsWith('/admin/dashboard')
                        ? 'text-[#008647]'
                        : 'text-[#2F3A4C]'
                    }`}
                    variant="ghost"
                  >
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/user/overview">
                  <Button
                    className={`px-6 transition-colors hover:bg-transparent hover:text-[#008647] ${
                      pathname.startsWith('/user/overview')
                        ? 'text-[#008647]'
                        : 'text-[#2F3A4C]'
                    }`}
                    variant="ghost"
                  >
                    Overview
                  </Button>
                </Link>
              )}
            </>
          )}
          <Link href="/auth/login">
            <Button className="bg-[#008647] px-6 text-white">Login</Button>
          </Link>
        </div>
        <MobileNav />
      </div>
    </header>
  );
};

export default Header;
