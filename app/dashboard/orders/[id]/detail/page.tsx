import Breadcrumbs from '@/app/ui/customers/breadcrumbs';
import OderLinesTable from '@/app/ui/orders/order_lines/table';
import TrackingInfo from '@/app/ui/orders/order_lines/tracking-info';
import Detail from '@/app/ui/orders/detail';
import { Suspense } from 'react';
import { OrderDetailSkeleton, CardSkeleton } from '@/app/ui/skeletons';
 
export default async function Page({
  params,
}: {
  params?: {
    id?: string;
  };
}) {
const id = params?.id || '';

return (
  <div className="w-full">
    <Breadcrumbs
            breadcrumbs={[
            { label: 'Orders', href: '/orders' },
            {
                label: `Order ${id}`,
                href: `/orders/${id}/detail`,
                active: true,
            },
            ]}
        />
    <Suspense key={id + 'detail'} fallback={<OrderDetailSkeleton />}>
      <Detail sale_id={id} />
    </Suspense>
    <div className="p-4">
      <Suspense key={id} fallback={<CardSkeleton />}>
        <OderLinesTable sale_id={id} />
      </Suspense>
    </div>
    <div className="p-4">
      <Suspense key={id} fallback={<CardSkeleton />}>
        <TrackingInfo sale_id={id} />
      </Suspense>
    </div>
  </div>
);
}