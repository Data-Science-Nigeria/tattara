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
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/auth/signup">
            <div className="text-[#494A58] hover:text-green-700">
              Admin
            </div>
          </Link>
          <Link href="/auth/login">
            <Button className="bg-[#008647] text-white px-6">
              Login
            </Button>
          </Link>
        </div>
        <MobileNav />
      </div>
    </header>
  );
};

export default Header;