import Search from '@/app/ui/search';
import TradeInTable from '@/app/ui/trade-in/table';
import UserInfoCard from '@/app/ui/user-info-card';
import { lusitana } from '@/app/ui/fonts';
import { Suspense } from 'react';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
import Link from 'next/link';
import { PlusIcon, BuildingStorefrontIcon } from '@heroicons/react/24/solid';
import { headers } from 'next/headers';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
  };
}) {
  // Force fresh data by accessing headers
  const headersList = headers();
  const timestamp = Date.now();
  
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;

  return (
    <div className="w-full p-20">
      {/* Header with user info */}
      <div className="flex w-full items-start justify-between mb-6">
        <div className="flex-1">
          <h1 className={`${lusitana.className} text-2xl`}>Trade-In Records</h1>
        </div>
        <div className="flex-shrink-0 ml-4">
          <UserInfoCard />
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex w-full items-center justify-end mb-6">
        <div className="flex gap-3">
          <Link href="/trade-in/store/new">
            <button className="flex items-center gap-1 rounded-md bg-green-500 px-3 py-2 text-white hover:bg-green-600">
              <BuildingStorefrontIcon className="h-5 w-5" />
              <span>Recepción Tienda</span>
            </button>
          </Link> 
          <Link href="/trade-in/new">
            <button className="flex items-center gap-1 rounded-md bg-blue-500 px-3 py-2 text-white hover:bg-blue-600">
              <PlusIcon className="h-5 w-5" />
              <span>Nuevo Ecom</span>
            </button>
          </Link>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Buscar registros de Trade-In..." />
      </div>
      <Suspense key={query + currentPage + timestamp} fallback={<InvoicesTableSkeleton />}>
        <TradeInTable query={query} currentPage={currentPage} />
      </Suspense>
    </div>
  );
}
