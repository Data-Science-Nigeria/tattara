'use client';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Menu } from 'lucide-react';
import Link from 'next/link';

export function MobileNav() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="size-10 md:hidden">
          <Menu size={20} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" collisionPadding={16}>
        <div className="flex flex-col gap-2">
          <Link href="/auth/signup">
            <Button
              variant="ghost"
              className="w-full justify-start text-[#494A58] hover:text-green-700"
            >
              Admin
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button className="w-full bg-[#008647] text-white">Login</Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
