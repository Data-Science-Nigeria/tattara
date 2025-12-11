import Logo from './logo';
import Link from 'next/link';
import { Button } from '../../components/ui/button';
import { MobileNav } from './mobile-nav';

const Header = () => {
  return (
    <header className="mb-8 flex items-center justify-between bg-white px-8 py-4">
      <div className="flex items-center space-x-2">
        <Logo className="h-10" />
      </div>
      <div className="flex items-center space-x-4">
        <div className="hidden items-center space-x-4 md:flex">
          {/* <Link href="#"> 
            <Button className="px-6 text-[#2F3A4C]" variant={'ghost'}>Dashboard</Button>
          </Link>*/}
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
