'use client';
import Link from 'next/link';
import NavLinks from '@/app/ui/dashboard/nav-links';
import PatagoniaLogo from '@/app/ui/patagonia-logo';
import { PowerIcon } from '@heroicons/react/24/outline';
import { signOut } from 'next-auth/react';

export default function SideNav() {
  const handleSignOut = async () => {
    console.log('Signing out...');
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2">
      <Link
        className="mb-2 flex items-center justify-center rounded-md bg-steelblue p-4"
        href="/"
      >
        <div className="relative w-full max-w-xs">
          <PatagoniaLogo />
        </div>
      </Link>
      <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0">
        <NavLinks />
        <div className="hidden h-auto w-full grow rounded-md bg-gray-50 mt-0 md:block"></div>
        <button
          onClick={handleSignOut}
          className="flex h-[48px] w-full grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3"
        >
          <PowerIcon className="w-6" />
          <div className="hidden md:block">Sign Out</div>
        </button>
      </div>
    </div>
  );
}

