'use client';
import React from 'react';
import Link from 'next/link';
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
  PresentationChartBarIcon,
  ChartBarSquareIcon,
  SquaresPlusIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const navItems = [
  {
    name: 'CCSS',
    icon: UserGroupIcon,
    roles: ['admin', 'user'],
    items: [
      { name: 'Orders', href: '/orders', icon: DocumentDuplicateIcon, roles: ['admin', 'user'] },
      { name: 'Customers', href: '/customers', icon: UserGroupIcon, roles: ['admin', 'user'] },
      { name: 'Incidences', href: '/incidences', icon: BellAlertIcon, roles: ['admin', 'user'] },
    ],
  },
  {
    name: 'Stock',
    icon: RectangleGroupIcon,
    roles: ['admin'],
    items: [
      { name: 'Registros Stock Planning', href: '/stock-planning', icon: CalculatorIcon, roles: ['admin'] },
      { name: 'Nueva Reposición', href: '/stock-planning/new', icon: SquaresPlusIcon, roles: ['admin'] },
    ],
  },
  {
    name: 'Trade In',
    icon: ArrowPathIcon,
    roles: ['admin'],
    items: [
      { name: 'Registros', href: '/trade-in', icon: DocumentDuplicateIcon, roles: ['admin'] },
      { name: 'Configuraciones', href: '/trade-in/config', icon: Cog8ToothIcon, roles: ['admin'] },
    ],
  },
  {
    name: 'Analytics',
    icon: ChartBarSquareIcon,
    roles: ['admin', 'user'],
    items: [
      { name: 'Dashboard', href: '/dashboard/analytics', icon: PresentationChartBarIcon, roles: ['admin', 'user'] },
    ],
  },
  { 
    name: 'Settings',
    icon: Cog8ToothIcon,
    roles: ['admin', 'user'],
    items: [
      { name: 'Users', href: '/users', icon: UserIcon, roles: ['admin'] },
      { name: 'Seguridad', href: '/security', icon: ShieldCheckIcon, roles: ['admin'] },
      { name: 'Parámetros', href: '/configs', icon: AdjustmentsVerticalIcon, roles: ['admin', 'user'] },
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
        href="/home"
        className='flex items-center gap-2 px-3 py-4 rounded-md font-medium text-gray-700 bg-gray-50 hover:bg-sky-100 hover:text-blue-600'
      >
        <HomeIcon className="w-5 h-5 text-gray-500" />
        <span>Home</span>
      </Link>

      {/* Collapsible Items */}
      {navItems
        .filter((section) => section.roles.includes(userRole))
        .map((section) => (
          <CollapsibleNavItem
            key={section.name}
            name={section.name}
            icon={section.icon}
            items={section.items.filter((item) => item.roles.includes(userRole))}
          />
        ))}
    </div>
  );
}
