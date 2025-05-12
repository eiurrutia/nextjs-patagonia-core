'use client';
import { useState, useEffect } from 'react';
import Breadcrumbs from '@/app/ui/customers/breadcrumbs';
import TradeInDetail from '@/app/ui/trade-in/detail';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import StatusDisplay from '@/app/ui/trade-in/status-display';
import StatusSelector from '@/app/ui/trade-in/status-selector';
import InvoiceAction from '@/app/ui/trade-in/invoice-action';
import { CardSkeleton } from '@/app/ui/skeletons';

type TradeInStatus = 'Etiqueta Enviada' | 'Producto Entregado' | 'Crédito Entregado';

export default function TradeInDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const [status, setStatus] = useState<TradeInStatus>('Etiqueta Enviada');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch(`/api/trade-in/${id}/status`);
                const { status } = await res.json();
                if (statuses.includes(status)) {
                  setStatus(status as TradeInStatus);
                }
            } catch (error) {
                console.error('Error fetching status:', error);
            } finally {
              setLoading(false);
          }
        };

        fetchStatus();
    }, [id]);

    const statuses: TradeInStatus[] = ['Etiqueta Enviada', 'Producto Entregado', 'Crédito Entregado'];

    return (
      <div className="w-full p-10">
          <Breadcrumbs
              breadcrumbs={[
                  { label: 'Trade-Ins', href: '/trade-in' },
                  { label: `Trade-In ${id}`, href: `/trade-in/${id}/detail`, active: true }
              ]}
          />

          <div className="flex gap-10">
              {/* Basic Info and Actions */}
              <div className="w-1/2 space-y-6">
                  <TradeInDetail id={id} />

                  {loading ? (
                      <CardSkeleton />
                  ) : (
                      <div className="p-2 pt-6 bg-gray-50 rounded-lg shadow-lg">
                          <h2 className="text-xl font-semibold mb-4 pl-4">Acciones</h2>
                          <div className="space-y-4 bg-white m-1 p-4 rounded-lg">
                              <div className="flex items-center space-x-4">
                                  <ArrowRightIcon className="h-6 w-6 text-gray-500" />
                                  <StatusSelector tradeInId={id} status={status} setStatus={setStatus} />
                              </div>
                              <div className="flex items-center space-x-4">
                                  <ArrowRightIcon className="h-6 w-6 text-gray-500" />
                                  <InvoiceAction tradeInId={id} />
                              </div>
                          </div>
                      </div>
                  )}
              </div>

              {/* Display Status */}
              <div className="w-1/2">
                  {loading ? (
                      <CardSkeleton />
                  ) : (
                      <div className="p-6 bg-white border-4 border-gray-50 rounded-lg">
                          <StatusDisplay currentStatus={status} />
                      </div>
                  )}
              </div>
          </div>
      </div>
  );
}
