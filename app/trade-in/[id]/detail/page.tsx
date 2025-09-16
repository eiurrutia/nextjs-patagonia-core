'use client';
import { useState, useEffect } from 'react';
import Breadcrumbs from '@/app/ui/customers/breadcrumbs';
import TradeInDetail from '@/app/ui/trade-in/detail';
import TradeInComments from '@/app/ui/trade-in/comments';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import StatusDisplay from '@/app/ui/trade-in/status-display';
import InvoiceAction from '@/app/ui/trade-in/invoice-action';
import { CardSkeleton } from '@/app/ui/skeletons';

type TradeInStatus = 
    | 'solicitud_recibida'      
    | 'etiqueta_enviada'        
    | 'recepcionado_tienda'     
    | 'credito_entregado'       
    | 'factura_enviada'         
    | 'enviado_vestua';         

type DeliveryMethod = 'shipping' | 'pickup' | 'store';

interface TradeInData {
    status: TradeInStatus;
    request_number: string;
    delivery_method: DeliveryMethod;
}

export default function TradeInDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const [tradeInData, setTradeInData] = useState<TradeInData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequestData = async () => {
            try {
                const res = await fetch(`/api/trade-in/requests/${id}`);
                const data = await res.json();
                setTradeInData({
                    status: data.status || 'solicitud_recibida',
                    request_number: data.request_number,
                    delivery_method: data.delivery_method
                });
            } catch (error) {
                console.error('Error fetching request data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRequestData();
    }, [id]);

    const handleStatusChange = (newStatus: TradeInStatus) => {
        if (tradeInData) {
            setTradeInData({
                ...tradeInData,
                status: newStatus
            });
        }
    };

    return (
        <div className="w-full p-10">
            <Breadcrumbs
                breadcrumbs={[
                    { label: 'Trade-Ins', href: '/trade-in' },
                    { 
                        label: tradeInData?.request_number || `Trade-In ${id}`, 
                        href: `/trade-in/${id}/detail`, 
                        active: true 
                    }
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

                    {/* Comments Section - Moved here from right column */}
                    {!loading && (
                        <TradeInComments tradeInId={id} />
                    )}
                </div>

                {/* Right Column - Status and Actions */}
                <div className="w-1/3 space-y-6">
                    {/* Status Display */}
                    {loading ? (
                        <CardSkeleton />
                    ) : tradeInData ? (
                        <div className="p-6 bg-white rounded-lg shadow-sm border">
                            <h2 className="text-lg font-semibold mb-4 text-gray-800">Estado de la Solicitud</h2>
                            <StatusDisplay 
                                currentStatus={tradeInData.status}
                                deliveryMethod={tradeInData.delivery_method}
                                tradeInId={id}
                                onStatusChange={handleStatusChange}
                            />
                        </div>
                    ) : null}

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
