import Breadcrumbs from '@/app/ui/customers/breadcrumbs';
import TradeInDetail from '@/app/ui/trade-in/detail';
import StatusSelector from '@/app/ui/trade-in/status-selector';
import InvoiceIcon from '@/app/ui/trade-in/invoice-icon';
import { Suspense } from 'react';
import { OrderDetailSkeleton } from '@/app/ui/skeletons';

export default async function TradeInDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;

  return (
    <div className="w-full m-20">
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Trade-Ins', href: '/trade-in' },
          {
            label: `Trade-In ${id}`,
            href: `/dashboard/trade-in/${id}/detail`,
            active: true,
          },
        ]}
      />

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Detalles</h1>
        <InvoiceIcon tradeInId={id} />
      </div>

      <Suspense fallback={<OrderDetailSkeleton />}>
        {/* Mostrar el selector de estado independiente */}
        <div className="mt-20 w-5/12">
          <StatusSelector tradeInId={id} />
        </div>
        {/* Mostrar los detalles del Trade-In */}
        <TradeInDetail id={id} />
      </Suspense>
    </div>
  );
}
