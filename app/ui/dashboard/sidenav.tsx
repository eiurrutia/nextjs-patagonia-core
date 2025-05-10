'use client';
import Link from 'next/link';
import NavLinks from '@/app/ui/dashboard/nav-links';
import PatagoniaLogo from '@/app/ui/patagonia-logo';
import { PowerIcon } from '@heroicons/react/24/outline';
import { signOut } from 'next-auth/react';

interface SideNavProps {
  onPin?: () => void;
  isPinned?: boolean;
}

export default function SideNav({ onPin, isPinned = false }: SideNavProps) {
  const handleSignOut = async () => {
    console.log('Signing out...');
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2 bg-gray-50 shadow-lg">
      <div className="flex items-center justify-between">
        <Link
          className="flex-1 flex items-center justify-center rounded-md bg-steelblue p-4"
          href="/home"
        >
          <div className="relative w-full max-w-xs">
            <PatagoniaLogo />
          </div>
        </Link>
        
        {/* Pin button */}
        {onPin && (
          <button
            onClick={onPin}
            className={`ml-2 p-2 rounded-full ${isPinned ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            aria-label={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
            title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" transform={isPinned ? 'rotate(0)' : 'rotate(45 12 12)'} />
            </svg>
          </button>
        )}
      </div>
      
      <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 mt-2">
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

