import Breadcrumbs from '@/app/ui/customers/breadcrumbs';
import CustomerShopifyInfo from '@/app/ui/customers/shopify-info';
import CustomerGeneralStats from '@/app/ui/customers/general-stats';
import Detail from '@/app/ui/customers/detail';
import CustomerOrders from '@/app/ui/customers/customer-orders';
import PeriodFilter from '@/app/ui/period-filter';
import { lusitana } from '@/app/ui/fonts';
import { Suspense } from 'react';
import { OrderDetailSkeleton, InvoicesTableSkeleton } from '@/app/ui/skeletons';
 
export default async function Page({
  params,
  searchParams,
}: {
  params?: {
    id?: string;
  },
  searchParams?: {
    period?: string;
  };
}) {
const id = params?.id || ''; 
const period = searchParams?.period || '3m'; 

return (
  <div className="w-full">
    <Breadcrumbs
            breadcrumbs={[
            { label: 'Customers', href: '/dashboard/customers' },
            {
                label: `Rut ${id}`,
                href: `/dashboard/customers/${id}/detail`,
                active: true,
            },
            ]}
        />
    <Suspense key={id + 'detail'} fallback={<OrderDetailSkeleton />}>
      <Detail customer_id={id} />
    </Suspense>
    <div className="p-4">
      <Suspense key={id} fallback={<InvoicesTableSkeleton />}>
        <CustomerGeneralStats customer_id={id} />
      </Suspense>
    </div>
    <div className="p-4">
      <h1 className={`${lusitana.className} text-2xl`}>Órdenes</h1>
      <PeriodFilter />
      <Suspense key={`${id}-${period}`} fallback={<InvoicesTableSkeleton />}>
        <CustomerOrders customer_id={id} period={period}/>
      </Suspense>
    </div>
    <div className="p-4">
      <Suspense key={id} fallback={<InvoicesTableSkeleton />}>
        <CustomerShopifyInfo customer_id={id} />
      </Suspense>
    </div>
  </div>
);
}