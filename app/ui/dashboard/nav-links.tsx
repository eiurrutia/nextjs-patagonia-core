'use client';
import {
  UserGroupIcon,
  HomeIcon,
  DocumentDuplicateIcon,
  BellAlertIcon,
  ArrowPathIcon,
  AdjustmentsVerticalIcon,
  UserIcon,
  Cog8ToothIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import clsx from 'clsx';

// Map of links to display in the side navigation.
const links = [
  {
    name: 'Home',
    href: '/dashboard',
    icon: HomeIcon,
    roles: ['admin', 'user'],
  },
  {
    name: 'Orders',
    href: '/dashboard/orders',
    icon: DocumentDuplicateIcon,
    roles: ['admin', 'user'],
  },
  { 
    name: 'Customers',
    href: '/dashboard/customers',
    icon: UserGroupIcon,
    roles: ['admin', 'user'],
  },
  { 
    name: 'Incidences',
    href: '/dashboard/incidences',
    icon: BellAlertIcon,
    roles: ['admin', 'user'],
  },
  { 
    name: 'Trade-In',
    href: '/trade-in',
    icon: ArrowPathIcon,
    roles: ['admin'],
  },
  { 
    name: 'Stock Planning',
    href: '/dashboard/stock-planning',
    icon: AdjustmentsVerticalIcon,
    roles: ['admin'],
  },
  { 
    name: 'Users',
    href: '/dashboard/users',
    icon: UserIcon,
    roles: ['admin'],
  },
  { 
    name: 'Settings',
    href: '/dashboard/configs',
    icon: Cog8ToothIcon,
    roles: ['admin', 'user'],
  },
];

export default function NavLinks() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (!session || !session.user || !session.user.role) {
    return null;
  }

  const userRole = session.user.role;

  return (
    <>
      {links
        .filter((link) => link.roles.includes(userRole as string))
        .map((link) => {
          const LinkIcon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={clsx(
                'flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3',
                {
                  'bg-sky-100 text-blue-600': pathname === link.href,
                },
              )}
            >
              <LinkIcon className="w-6" />
              <p className="hidden md:block">{link.name}</p>
            </Link>
          );
        })}
    </>
  );
}
