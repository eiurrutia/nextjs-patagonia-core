import TradeInTable from '@/app/ui/trade-in/table';
import TradeInProductsListTable from '@/app/ui/trade-in/products-list-table';
import TradeInClientWrapper from '@/app/ui/trade-in/trade-in-client-wrapper';
import UserInfoCard from '@/app/ui/user-info-card';
import { lusitana } from '@/app/ui/fonts';
import { Suspense } from 'react';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
import { headers } from 'next/headers';
import { getStores } from '@/app/lib/stores/sql-data';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Define filter types
interface TradeInFilters {
  requestNumber?: string;
  customer?: string;
  status?: string[];
  deliveryMethod?: string[];
  store?: string;
  dateFrom?: string;
  dateTo?: string;
  productStyle?: string;
  productState?: string;
}

export default async function Page({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
    requestNumber?: string;
    customer?: string;
    status?: string;
    deliveryMethod?: string;
    store?: string;
    dateFrom?: string;
    dateTo?: string;
    productStyle?: string;
    productState?: string;
  };
}) {
  // Force fresh data by accessing headers
  const headersList = headers();
  const timestamp = Date.now();
  
  const currentPage = Number(searchParams?.page) || 1;
  
  // Parse filters from searchParams
  const filters: TradeInFilters = {
    requestNumber: searchParams?.requestNumber || undefined,
    customer: searchParams?.customer || undefined,
    status: searchParams?.status?.split(',').filter(Boolean) || undefined,
    deliveryMethod: searchParams?.deliveryMethod?.split(',').filter(Boolean) || undefined,
    store: searchParams?.store || undefined,
    dateFrom: searchParams?.dateFrom || undefined,
    dateTo: searchParams?.dateTo || undefined,
    productStyle: searchParams?.productStyle || undefined,
    productState: searchParams?.productState || undefined,
  };
  
  // Get stores for filter dropdown
  const stores = await getStores();

  return (
    <div className="w-full px-6 py-4">
      {/* Header with user info */}
      <div className="flex w-full items-center justify-between mb-4">
        <h1 className={`${lusitana.className} text-2xl`}>Solicitudes Trade-In</h1>
        <UserInfoCard />
      </div>
      
      <TradeInClientWrapper stores={stores}>
        {/* Tab 1: Solicitudes */}
        <div>
          <Suspense key={JSON.stringify(filters) + currentPage + timestamp + 'requests'} fallback={<InvoicesTableSkeleton />}>
            <TradeInTable filters={filters} currentPage={currentPage} />
          </Suspense>
        </div>
        
        {/* Tab 2: Productos */}
        <div>
          <Suspense key={JSON.stringify(filters) + currentPage + timestamp + 'products'} fallback={<InvoicesTableSkeleton />}>
            <TradeInProductsListTable filters={filters} currentPage={currentPage} />
          </Suspense>
        </div>
      </TradeInClientWrapper>
    </div>
  );
}
