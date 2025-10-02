'use client';
import Link from 'next/link';

interface LogoProps {
  className?: string;
}

const Logo = ({ className = "h-10" }: LogoProps) => {
  return (
    <Link href="/">
      <img src="/logo.svg" alt="logo" className={className} />
    </Link>
  );
};

export default Logo;