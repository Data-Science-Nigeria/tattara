'use client';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '../store/use-auth-store';
import { usePathname } from 'next/navigation';

export function MobileNav() {
  const { auth } = useAuthStore();
  const pathname = usePathname();
  const isAdmin =
    auth?.roles?.includes('admin') || auth?.roles?.includes('super-admin');

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="size-10 md:hidden">
          <Menu size={20} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" collisionPadding={16}>
        <div className="flex flex-col gap-2">
          {auth?.token && (
            <>
              {isAdmin ? (
                <Link href="/admin/dashboard">
                  <Button
                    className={`w-full transition-colors hover:bg-transparent hover:text-[#008647] ${
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
                    className={`w-full transition-colors hover:bg-transparent hover:text-[#008647] ${
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
            <Button className="w-full bg-[#008647] text-white">Login</Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
