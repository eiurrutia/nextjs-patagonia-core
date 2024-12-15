'use client';
import React from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import CollapsibleNavItem from './collapsible-nav-item';
import {
  HomeIcon,
  DocumentDuplicateIcon,
  UserGroupIcon,
  BellAlertIcon,
  ArrowPathIcon,
  AdjustmentsVerticalIcon,
  UserIcon,
  Cog8ToothIcon,
  CalculatorIcon,
  RectangleGroupIcon,
  PresentationChartBarIcon
} from '@heroicons/react/24/outline';

const navItems = [
  {
    name: 'CCSS',
    icon: UserGroupIcon,
    items: [
      { name: 'Dashboard', href: null, icon: PresentationChartBarIcon },
      { name: 'Orders', href: '/dashboard/orders', icon: DocumentDuplicateIcon },
      { name: 'Customers', href: '/dashboard/customers', icon: UserGroupIcon },
      { name: 'Incidences', href: '/dashboard/incidences', icon: BellAlertIcon },
    ],
  },
  {
    name: 'Stock',
    icon: RectangleGroupIcon,
    items: [
      { name: 'Stock Planning', href: '/dashboard/stock-planning', icon: CalculatorIcon },
    ],
  },
  {
    name: 'Trade In',
    icon: ArrowPathIcon,
    items: [
      { name: 'Registros', href: '/trade-in', icon: DocumentDuplicateIcon },
    ],
  },
  {
    name: 'Settings',
    icon: Cog8ToothIcon,
    items: [
      { name: 'Users', href: '/dashboard/users', icon: UserIcon },
      { name: 'Parámetros', href: '/dashboard/configs', icon: AdjustmentsVerticalIcon },
    ],
  },
];

export default function NavLinks() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (!session || !session.user || !session.user.role) {
    return null;
  }

  const userRole = session.user.role;

  return (
    <div>
      {/* Home */}
      <Link
        href="/dashboard"
        className='flex items-center gap-2 px-3 py-4 rounded-md font-medium text-gray-700 bg-gray-50 hover:bg-sky-100 hover:text-blue-600'
        
      >
        <HomeIcon className="w-5 h-5 text-gray-500" />
        <span>Home</span>
      </Link>

      {/* Collapsible Items */}
      {navItems.map((section) => (
        <CollapsibleNavItem
          key={section.name}
          name={section.name}
          icon={section.icon}
          items={section.items}
        />
      ))}
    </div>
  );
}