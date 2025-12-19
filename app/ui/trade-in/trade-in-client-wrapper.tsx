'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PlusIcon } from '@heroicons/react/24/solid';
import { ClipboardDocumentListIcon, TagIcon } from '@heroicons/react/24/outline';
import AdvancedFilters from '@/app/ui/trade-in/advanced-filters';
import TableActionsMenu from '@/app/ui/trade-in/table-actions-menu';

interface Store {
  id: string;
  name: string;
  code: string;
}

interface TradeInClientWrapperProps {
  stores: Store[];
  children: React.ReactNode[];
}

export default function TradeInClientWrapper({ stores, children }: TradeInClientWrapperProps) {
  const [activeTab, setActiveTab] = useState<'requests' | 'products'>('requests');
  const searchParams = useSearchParams();

  const handleTabChange = (tab: 'requests' | 'products') => {
    setActiveTab(tab);
  };

  // Get current filters from URL
  const getCurrentFilters = () => ({
    requestNumber: searchParams?.get('requestNumber') || undefined,
    customer: searchParams?.get('customer') || undefined,
    status: searchParams?.get('status')?.split(',').filter(Boolean) || undefined,
    deliveryMethod: searchParams?.get('deliveryMethod')?.split(',').filter(Boolean) || undefined,
    store: searchParams?.get('store') || undefined,
    dateFrom: searchParams?.get('dateFrom') || undefined,
    dateTo: searchParams?.get('dateTo') || undefined,
    productStyle: searchParams?.get('productStyle') || undefined,
    productState: searchParams?.get('productState') || undefined,
  });

  return (
    <>
      {/* Tabs row with action button */}
      <div className="flex items-center justify-between border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => handleTabChange('requests')}
            className={`
              group inline-flex items-center py-3 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'requests'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <ClipboardDocumentListIcon
              className={`
                -ml-0.5 mr-2 h-5 w-5
                ${activeTab === 'requests'
                  ? 'text-indigo-500'
                  : 'text-gray-400 group-hover:text-gray-500'
                }
              `}
              aria-hidden="true"
            />
            Solicitudes
          </button>
          <button
            onClick={() => handleTabChange('products')}
            className={`
              group inline-flex items-center py-3 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'products'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <TagIcon
              className={`
                -ml-0.5 mr-2 h-5 w-5
                ${activeTab === 'products'
                  ? 'text-indigo-500'
                  : 'text-gray-400 group-hover:text-gray-500'
                }
              `}
              aria-hidden="true"
            />
            Productos
          </button>
        </nav>
        
        <div className="flex items-center gap-2">
          <TableActionsMenu type={activeTab} filters={getCurrentFilters()} />
          <Link href="/trade-in/new">
            <button className="flex items-center gap-1 rounded-md bg-blue-500 px-3 py-2 text-white hover:bg-blue-600 text-sm">
              <PlusIcon className="h-4 w-4" />
              <span>Nueva Solicitud</span>
            </button>
          </Link>
        </div>
      </div>
      
      {/* Filters */}
      <AdvancedFilters activeTab={activeTab} stores={stores} />
      
      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'requests' ? children[0] : children[1]}
      </div>
    </>
  );
}
