'use client';

import { useState } from 'react';
import { ClipboardDocumentListIcon, TagIcon } from '@heroicons/react/24/outline';

interface TabsProps {
  children: React.ReactNode[];
  tabLabels: string[];
  tabIcons?: ('clipboard' | 'tag')[];
}

export default function Tabs({ children, tabLabels, tabIcons }: TabsProps) {
  const [activeTab, setActiveTab] = useState(0);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'clipboard':
        return ClipboardDocumentListIcon;
      case 'tag':
        return TagIcon;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabLabels.map((label, index) => {
            const Icon = tabIcons?.[index] ? getIcon(tabIcons[index]) : null;
            return (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === index
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {Icon && (
                  <Icon
                    className={`
                      -ml-0.5 mr-2 h-5 w-5
                      ${activeTab === index
                        ? 'text-indigo-500'
                        : 'text-gray-400 group-hover:text-gray-500'
                      }
                    `}
                    aria-hidden="true"
                  />
                )}
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {children[activeTab]}
      </div>
    </div>
  );
}