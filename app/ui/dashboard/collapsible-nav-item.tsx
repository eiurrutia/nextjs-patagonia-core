'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

function CollapsibleNavItem({
  name,
  icon: ItemIcon,
  items,
}: {
  name: string;
  icon: React.ElementType;
  items: { name: string; href: string | null; icon: React.ElementType }[];
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div>
      {/* Item */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between px-3 py-4 cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-md"
      >
        <div className="flex items-center gap-2">
          <ItemIcon className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-700">{name}</span>
        </div>
        {isCollapsed ? (
          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronRightIcon className="h-5 w-5 text-gray-500" />
        )}
      </div>

      {/* Subitems */}
      {isCollapsed && (
        <div className="pl-6 space-y-1 pt-2 bg-gray-50">
          {items.map((item) => (
            <Link
              key={item.name}
              href={item.href || '#'}
              className={clsx(
                'flex items-center gap-2 px-3 py-4 rounded-md text-sm font-medium text-gray-600 hover:bg-sky-100 hover:text-blue-600',
                { 'cursor-default': !item.href }
              )}
            >
              <item.icon className="w-5 h-5 text-gray-500" />
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default CollapsibleNavItem;
