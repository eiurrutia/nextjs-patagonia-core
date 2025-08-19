'use client';
import { useState, useEffect } from 'react';
import { UserIcon, EnvelopeIcon, PhoneIcon, HomeIcon, PencilIcon, MapPinIcon, TruckIcon, HashtagIcon } from '@heroicons/react/24/outline';
import { CardSkeleton } from '@/app/ui/skeletons';
import Image from 'next/image';

const fieldIcons = {
    name: <UserIcon className="h-6 w-6 text-gray-500" />,
    email: <EnvelopeIcon className="h-6 w-6 text-gray-500" />,
    phone: <PhoneIcon className="h-6 w-6 text-gray-500" />,
    address: <HomeIcon className="h-6 w-6 text-gray-500" />,
    location: <MapPinIcon className="h-6 w-6 text-gray-500" />,
    delivery: <TruckIcon className="h-6 w-6 text-gray-500" />,
    comment: <PencilIcon className="h-6 w-6 text-gray-500" />,
    requestNumber: <HashtagIcon className="h-6 w-6 text-blue-500" />
};

export default function TradeInDetail({ id }: { id: string }) {
    const [record, setRecord] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTradeInRecord = async () => {
            try {
                const res = await fetch(`/api/trade-in/requests/${id}`);
                const data = await res.json();
                setRecord(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching trade-in record:', error);
                setIsLoading(false);
            }
        };

        fetchTradeInRecord();
    }, [id]);

    if (isLoading) return <><CardSkeleton /></>;
    if (!record) return <div>No se encontró el registro.</div>;

    return (
        <div className="space-y-6">
            {/* Request Header */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3 mb-2">
                    {fieldIcons.requestNumber}
                    <h1 className="text-2xl font-bold text-blue-700">{record.request_number}</h1>
                </div>
                <p className="text-sm text-gray-600">Solicitud Trade-in • {(() => {
                    if (!record.created_at) return 'N/A';
                    
                    // Convert to string if it's a Date object
                    const dateString = record.created_at instanceof Date ? record.created_at.toISOString() : record.created_at.toString();
                    
                    // Handle different date formats - now that SQL queries use AT TIME ZONE 'UTC',
                    // dates should come as proper UTC ISO strings
                    const utcDate = new Date(dateString);
                    
                    return new Intl.DateTimeFormat('es-CL', {
                        timeZone: 'America/Santiago',
                        day: '2-digit',
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    }).format(utcDate);
                })()}</p>
            </div>

            {/* Client Information */}
            <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Información del Cliente</h2>
                <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                        {fieldIcons.name}
                        <div>
                            <p className="font-medium">{record.first_name} {record.last_name}</p>
                            <p className="text-sm text-gray-500">Nombre completo</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        {fieldIcons.email}
                        <div>
                            <p className="font-medium">{record.email}</p>
                            <p className="text-sm text-gray-500">Email de contacto</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        {fieldIcons.phone}
                        <div>
                            <p className="font-medium">{record.phone}</p>
                            <p className="text-sm text-gray-500">Teléfono</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Location & Delivery */}
            <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Ubicación y Entrega</h2>
                <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                        {fieldIcons.location}
                        <div>
                            <p className="font-medium">{record.region}, {record.comuna}</p>
                            <p className="text-sm text-gray-500">Región y comuna</p>
                        </div>
                    </div>
                    {record.address && (
                        <div className="flex items-center space-x-4">
                            {fieldIcons.address}
                            <div>
                                <p className="font-medium">{record.address}</p>
                                {record.house_details && (
                                    <p className="text-sm text-gray-500">{record.house_details}</p>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="flex items-center space-x-4">
                        {fieldIcons.delivery}
                        <div>
                            <p className="font-medium">
                                {record.delivery_method === 'shipping' ? 'Envío por Chilexpress/Blue Express' : 'Retiro a domicilio'}
                            </p>
                            <p className="text-sm text-gray-500">Método de entrega</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products */}
            <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Productos ({record.products?.length || 0})</h2>
                {record.products && record.products.length > 0 ? (
                    <div className="space-y-4">
                        {record.products.map((product: any, index: number) => (
                            <div key={product.id} className="p-4 bg-gray-50 rounded-lg border">
                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <span className="text-blue-600 font-semibold">{index + 1}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900">{product.product_style}</h3>
                                        <p className="text-sm text-gray-600 mt-1">Talla: {product.product_size}</p>
                                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">Signos de uso:</span>
                                                <span className="ml-1 font-medium">{product.usage_signs}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Pilling:</span>
                                                <span className="ml-1 font-medium">{product.pilling_level}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Roturas/Agujeros:</span>
                                                <span className="ml-1 font-medium">{product.tears_holes_level}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Reparaciones:</span>
                                                <span className="ml-1 font-medium">{product.repairs_level}</span>
                                            </div>
                                        </div>
                                        {product.credit_range && (
                                            <div className="mt-2">
                                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                    Crédito: {product.credit_range}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No hay productos asociados a esta solicitud.</p>
                )}
            </div>

            {/* Comments */}
            {record.client_comment && (
                <div className="p-6 bg-white rounded-lg shadow-sm border">
                    <h2 className="text-lg font-semibold mb-4 text-gray-800">Historia del Producto</h2>
                    <div className="flex items-start space-x-4">
                        {fieldIcons.comment}
                        <div className="flex-1">
                            <p className="text-gray-700 leading-relaxed">{record.client_comment}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
