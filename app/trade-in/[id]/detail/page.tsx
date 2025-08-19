'use client';
import { useState, useEffect } from 'react';
import Breadcrumbs from '@/app/ui/customers/breadcrumbs';
import TradeInDetail from '@/app/ui/trade-in/detail';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import StatusDisplay from '@/app/ui/trade-in/status-display';
import StatusSelector from '@/app/ui/trade-in/status-selector';
import InvoiceAction from '@/app/ui/trade-in/invoice-action';
import { CardSkeleton } from '@/app/ui/skeletons';

type TradeInStatus = 'pending' | 'approved' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
type LegacyTradeInStatus = 'Etiqueta Enviada' | 'Producto Entregado' | 'Crédito Entregado';

// Mapping functions between new and legacy status types
const mapToLegacyStatus = (status: TradeInStatus): LegacyTradeInStatus => {
    switch (status) {
        case 'pending':
        case 'approved':
            return 'Etiqueta Enviada';
        case 'shipped':
        case 'delivered':
            return 'Producto Entregado';
        case 'completed':
        case 'cancelled':
        default:
            return 'Crédito Entregado';
    }
};

const mapFromLegacyStatus = (legacyStatus: LegacyTradeInStatus): TradeInStatus => {
    switch (legacyStatus) {
        case 'Etiqueta Enviada':
            return 'pending';
        case 'Producto Entregado':
            return 'delivered';
        case 'Crédito Entregado':
            return 'completed';
        default:
            return 'pending';
    }
};

export default function TradeInDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const [status, setStatus] = useState<TradeInStatus>('pending');
    const [loading, setLoading] = useState(true);
    const [requestNumber, setRequestNumber] = useState<string>('');

    useEffect(() => {
        const fetchRequestData = async () => {
            try {
                const res = await fetch(`/api/trade-in/requests/${id}`);
                const data = await res.json();
                setStatus(data.status);
                setRequestNumber(data.request_number);
            } catch (error) {
                console.error('Error fetching request data:', error);
            } finally {
              setLoading(false);
          }
        };

        fetchRequestData();
    }, [id]);

    const statuses: TradeInStatus[] = ['pending', 'approved', 'shipped', 'delivered', 'completed', 'cancelled'];

    return (
      <div className="w-full p-10">
          <Breadcrumbs
              breadcrumbs={[
                  { label: 'Trade-Ins', href: '/trade-in' },
                  { label: requestNumber || `Trade-In ${id}`, href: `/trade-in/${id}/detail`, active: true }
              ]}
          />

          <div className="flex gap-10">
              {/* Left Column - Trade-In Details */}
              <div className="w-2/3 space-y-6">
                  {loading ? (
                      <CardSkeleton />
                  ) : (
                      <TradeInDetail id={id} />
                  )}
              </div>

              {/* Right Column - Status and Actions */}
              <div className="w-1/3 space-y-6">
                  {/* Status Display */}
                  {loading ? (
                      <CardSkeleton />
                  ) : (
                      <div className="p-6 bg-white rounded-lg shadow-sm border">
                          <h2 className="text-lg font-semibold mb-4 text-gray-800">Estado de la Solicitud</h2>
                          <StatusDisplay currentStatus={mapToLegacyStatus(status)} />
                      </div>
                  )}

                  {/* Actions Panel */}
                  {loading ? (
                      <CardSkeleton />
                  ) : (
                      <div className="p-6 bg-white rounded-lg shadow-sm border">
                          <h2 className="text-lg font-semibold mb-4 text-gray-800">Acciones</h2>
                          <div className="space-y-4">
                              <div className="flex items-center space-x-4">
                                  <ArrowRightIcon className="h-6 w-6 text-gray-500" />
                                  <div className="flex-1">
                                      <StatusSelector 
                                          tradeInId={id} 
                                          status={mapToLegacyStatus(status)} 
                                          setStatus={(newLegacyStatus: LegacyTradeInStatus) => setStatus(mapFromLegacyStatus(newLegacyStatus))} 
                                      />
                                  </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                  <ArrowRightIcon className="h-6 w-6 text-gray-500" />
                                  <div className="flex-1">
                                      <InvoiceAction tradeInId={id} />
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>
  );
}
