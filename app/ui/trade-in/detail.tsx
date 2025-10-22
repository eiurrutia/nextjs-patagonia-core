'use client';
import { useState, useEffect } from 'react';
import { UserIcon, EnvelopeIcon, PhoneIcon, HomeIcon, PencilIcon, MapPinIcon, TruckIcon, HashtagIcon, EyeIcon } from '@heroicons/react/24/outline';
import { CardSkeleton } from '@/app/ui/skeletons';
import Image from 'next/image';
import { conditionQuestions, getConditionOptionLabel } from '@/app/lib/trade-in/condition-images';
import { getStateDisplayColors } from '@/app/lib/trade-in/product-condition-evaluator';

const fieldIcons = {
    name: <UserIcon className="h-6 w-6 text-gray-500" />,
    email: <EnvelopeIcon className="h-6 w-6 text-gray-500" />,
    phone: <PhoneIcon className="h-6 w-6 text-gray-500" />,
    address: <HomeIcon className="h-6 w-6 text-gray-500" />,
    location: <MapPinIcon className="h-6 w-6 text-gray-500" />,
    delivery: <TruckIcon className="h-6 w-6 text-gray-500" />,
    comment: <PencilIcon className="h-6 w-6 text-gray-500" />,
    requestNumber: <HashtagIcon className="h-6 w-6 text-blue-500" />,
    condition: <EyeIcon className="h-6 w-6 text-gray-500" />
};

export default function TradeInDetail({ id }: { id: string }) {
    const [record, setRecord] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openImageModal = (imageUrl: string) => {
        setSelectedImage(imageUrl);
        setIsModalOpen(true);
    };

    const closeImageModal = () => {
        setSelectedImage(null);
        setIsModalOpen(false);
    };

    // Helper function to get condition details
    const getConditionDetails = (questionId: string, value: string) => {
        const question = conditionQuestions.find(q => q.id === questionId);
        const option = question?.options.find(opt => opt.value === value);
        return {
            label: option?.label || value,
            description: option?.description || '',
            imageUrl: option?.imageUrl || '',
            question: question?.question || questionId
        };
    };

    // Get condition color based on level
    const getConditionColor = (value: string) => {
        switch(value) {
            case 'no_presenta': return 'text-green-600 bg-green-50 border-green-200';
            case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'high': return 'text-red-600 bg-red-50 border-red-200';
            case 'yes': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'no': return 'text-green-600 bg-green-50 border-green-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    // Generate Patagonia image URL from product style
    const generatePatagoniaImageUrl = (productStyle: string) => {
        if (!productStyle || productStyle.length < 8) return null;
        
        // Replace dash with underscore for Patagonia URL format
        const formattedStyle = productStyle.replace('-', '_');
        
        // Generate Patagonia image URL
        return `https://production-us2.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/images/hi-res/${formattedStyle}.jpg?sw=2000&sh=2000&sfrm=png&q=95&bgcolor=f5f5f5`;
    };

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

            {/* Client Information and Location */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Client Information */}
                <div className="lg:col-span-3 p-6 bg-white rounded-lg shadow-sm border">
                    <div className="flex items-center space-x-3 mb-4">
                        {fieldIcons.name}
                        <h2 className="text-lg font-semibold text-gray-800">Información del Cliente</h2>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-600 w-20 flex-shrink-0">Nombre:</span>
                            <span className="text-sm text-gray-800">{record.first_name} {record.last_name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-600 w-20 flex-shrink-0">RUT:</span>
                            <span className="text-sm text-gray-800">{record.rut}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-600 w-20 flex-shrink-0">Email:</span>
                            <span className="text-sm text-gray-800 break-all">{record.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-600 w-20 flex-shrink-0">Teléfono:</span>
                            <span className="text-sm text-gray-800">{record.phone}</span>
                        </div>
                        <div className="flex items-start space-x-2">
                            <span className="text-sm font-medium text-gray-600 w-20 flex-shrink-0">Dirección:</span>
                            <span className="text-sm text-gray-800 break-words leading-relaxed">{record.address}</span>
                        </div>
                    </div>
                </div>

                {/* Location and Delivery */}
                <div className="lg:col-span-2 p-6 bg-white rounded-lg shadow-sm border">
                    <div className="flex items-center space-x-3 mb-4">
                        {fieldIcons.location}
                        <h2 className="text-lg font-semibold text-gray-800">Entrega</h2>
                    </div>
                    <div className="space-y-4">
                        {/* Delivery Method */}
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            {fieldIcons.delivery}
                            <div>
                                <span className="text-sm font-medium text-gray-600">Método de entrega:</span>
                                <p className="text-sm text-gray-800 font-medium capitalize mt-1">
                                    {record.delivery_method === 'store' ? 'Entrega en tienda' : 
                                     record.delivery_method === 'shipping' ? 'Envío' : 
                                     record.delivery_method === 'pickup' ? 'Retiro a domicilio' : 
                                     record.delivery_method}
                                </p>
                            </div>
                        </div>

                        {/* Store Information (only for store delivery) */}
                        {record.delivery_method === 'store' && record.received_store_code && (
                            <div className="p-3 bg-gray-50 border border-gray-50 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-600">Tienda:</span>
                                    <span className="text-sm text-gray-800 font-medium">{record.received_store_code}</span>
                                </div>
                            </div>
                        )}

                        {/* Address (for home delivery methods only) */}
                        {record.delivery_method !== 'store' && record.address && (
                            <div className="space-y-2">
                                <span className="text-sm font-medium text-gray-600">Dirección de entrega:</span>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-800 break-words leading-relaxed">{record.address}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Products */}
            <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Productos ({record.products?.length || 0})</h2>
                {record.products && record.products.length > 0 ? (
                    <div className="space-y-4">
                        {record.products.map((product: any, index: number) => {
                            return (
                            <div key={product.id} className="p-4 bg-gray-50 rounded-lg border relative">
                                <div className="flex items-start space-x-4">
                                    {/* Product Image */}
                                    <div className="flex-shrink-0">
                                        <div className="w-20 h-20 relative bg-white rounded-lg border overflow-hidden">
                                            {generatePatagoniaImageUrl(product.product_style) ? (
                                                <Image
                                                    src={generatePatagoniaImageUrl(product.product_style)!}
                                                    alt={product.product_style}
                                                    fill
                                                    sizes="80px"
                                                    className="object-cover"
                                                    onError={(e) => {
                                                        // Fallback to numbered badge if image fails
                                                        e.currentTarget.style.display = 'none';
                                                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                        if (fallback) fallback.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div className="w-full h-full bg-blue-100 rounded-lg flex items-center justify-center" style={{display: generatePatagoniaImageUrl(product.product_style) ? 'none' : 'flex'}}>
                                                <span className="text-blue-600 font-semibold">{index + 1}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-medium text-gray-900">{product.product_style}</h3>
                                                <p className="text-sm text-gray-600 mt-1">Talla: {product.product_size}</p>
                                            </div>
                                            {/* Product State Badge - Use confirmed state if available */}
                                            <div className="flex flex-col items-end space-y-1">
                                                {(product.confirmed_calculated_state || product.calculated_state) && (
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        getStateDisplayColors((product.confirmed_calculated_state || product.calculated_state) as any).bg
                                                    } ${getStateDisplayColors((product.confirmed_calculated_state || product.calculated_state) as any).text}`}>
                                                        {product.confirmed_calculated_state || product.calculated_state}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Product Condition with Visual Indicators */}
                                        <div className="mt-3 space-y-2">
                                            {/* Usage Signs - Main indicator - Use confirmed value if available, otherwise original */}
                                            {(product.confirmed_usage_signs || product.usage_signs) && (
                                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getConditionColor(product.confirmed_usage_signs || product.usage_signs)}`}>
                                                    <span className="mr-2">👁️</span>
                                                    Señales de uso: {getConditionDetails('usage_signs', product.confirmed_usage_signs || product.usage_signs).label}
                                                </div>
                                            )}
                                            
                                            {/* Detailed conditions grid (only if usage_signs is 'yes') */}
                                            {(product.confirmed_usage_signs || product.usage_signs) === 'yes' && (
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    {/* Pilling Level - Use confirmed value if available */}
                                                    {(product.confirmed_pilling_level || product.pilling_level) && (
                                                        <div className={`flex items-center p-2 rounded-lg text-xs ${getConditionColor(product.confirmed_pilling_level || product.pilling_level)}`}>
                                                            <div className="flex items-center space-x-2">
                                                                {getConditionDetails('pilling_level', product.confirmed_pilling_level || product.pilling_level).imageUrl && (
                                                                    <div className="w-6 h-6 relative flex-shrink-0">
                                                                        <Image
                                                                            src={getConditionDetails('pilling_level', product.confirmed_pilling_level || product.pilling_level).imageUrl}
                                                                            alt={`Pilling ${product.confirmed_pilling_level || product.pilling_level}`}
                                                                            fill
                                                                            className="object-cover rounded"
                                                                        />
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <div className="font-medium">Pilling</div>
                                                                    <div>{getConditionDetails('pilling_level', product.confirmed_pilling_level || product.pilling_level).label}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Tears and Holes - Use confirmed value if available */}
                                                    {(product.confirmed_tears_holes_level || product.tears_holes_level) && (
                                                        <div className={`flex items-center p-2 rounded-lg text-xs ${getConditionColor(product.confirmed_tears_holes_level || product.tears_holes_level)}`}>
                                                            <div className="flex items-center space-x-2">
                                                                {getConditionDetails('tears_holes_level', product.confirmed_tears_holes_level || product.tears_holes_level).imageUrl && (
                                                                    <div className="w-6 h-6 relative flex-shrink-0">
                                                                        <Image
                                                                            src={getConditionDetails('tears_holes_level', product.confirmed_tears_holes_level || product.tears_holes_level).imageUrl}
                                                                            alt={`Rasgaduras ${product.confirmed_tears_holes_level || product.tears_holes_level}`}
                                                                            fill
                                                                            className="object-cover rounded"
                                                                        />
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <div className="font-medium">Rasgaduras</div>
                                                                    <div>{getConditionDetails('tears_holes_level', product.confirmed_tears_holes_level || product.tears_holes_level).label}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Repairs - Use confirmed value if available */}
                                                    {(product.confirmed_repairs_level || product.repairs_level) && (
                                                        <div className={`flex items-center p-2 rounded-lg text-xs ${getConditionColor(product.confirmed_repairs_level || product.repairs_level)}`}>
                                                            <div className="flex items-center space-x-2">
                                                                {getConditionDetails('repairs_level', product.confirmed_repairs_level || product.repairs_level).imageUrl && (
                                                                    <div className="w-6 h-6 relative flex-shrink-0">
                                                                        <Image
                                                                            src={getConditionDetails('repairs_level', product.confirmed_repairs_level || product.repairs_level).imageUrl}
                                                                            alt={`Reparaciones ${product.confirmed_repairs_level || product.repairs_level}`}
                                                                            fill
                                                                            className="object-cover rounded"
                                                                        />
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <div className="font-medium">Reparaciones</div>
                                                                    <div>{getConditionDetails('repairs_level', product.confirmed_repairs_level || product.repairs_level).label}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Stains - Use confirmed value if available */}
                                                    {(product.confirmed_stains_level || product.stains_level) && (
                                                        <div className={`flex items-center p-2 rounded-lg text-xs ${getConditionColor(product.confirmed_stains_level || product.stains_level)}`}>
                                                            <div className="flex items-center space-x-2">
                                                                {getConditionDetails('stains_level', product.confirmed_stains_level || product.stains_level).imageUrl && (
                                                                    <div className="w-6 h-6 relative flex-shrink-0">
                                                                        <Image
                                                                            src={getConditionDetails('stains_level', product.confirmed_stains_level || product.stains_level).imageUrl}
                                                                            alt={`Manchas ${product.confirmed_stains_level || product.stains_level}`}
                                                                            fill
                                                                            className="object-cover rounded"
                                                                        />
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <div className="font-medium">Manchas</div>
                                                                    <div>{getConditionDetails('stains_level', product.confirmed_stains_level || product.stains_level).label}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Repairs Required - Simplified format */}
                                            {(product.tears_holes_repairs || product.repairs_level_repairs || product.stains_level_repairs) && (
                                                <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                                                    <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                                                        <span className="mr-2">🔧</span>
                                                        Reparaciones Requeridas
                                                    </h4>
                                                    <div className="space-y-1 text-xs text-gray-600">
                                                        {/* Tears/Holes Repairs */}
                                                        {product.tears_holes_repairs && (
                                                            <div>
                                                                <span className="font-medium">Rasgaduras/Agujeros:</span> {product.tears_holes_repairs.split(';').map((repair: string) => repair.trim().replace(/_/g, ' ')).join(', ')}
                                                            </div>
                                                        )}

                                                        {/* Previous Repairs */}
                                                        {product.repairs_level_repairs && (
                                                            <div>
                                                                <span className="font-medium">Reparaciones Previas:</span> {product.repairs_level_repairs.split(';').map((repair: string) => repair.trim().replace(/_/g, ' ')).join(', ')}
                                                            </div>
                                                        )}

                                                        {/* Stains Repairs */}
                                                        {product.stains_level_repairs && (
                                                            <div>
                                                                <span className="font-medium">Manchas:</span> {product.stains_level_repairs.split(';').map((repair: string) => repair.trim().replace(/_/g, ' ')).join(', ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Credit Range */}
                                        {product.credit_range && (
                                            <div className="mt-3">
                                                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                                                    💰 Crédito: {product.credit_range}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Product Images - Bottom Right Corner */}
                                {product.product_images && product.product_images.length > 0 && (
                                    <div className="absolute bottom-3 right-3">
                                        <div className="flex -space-x-1">
                                            {product.product_images.slice(0, 3).map((imageUrl: string, imageIndex: number) => (
                                                <div 
                                                    key={imageIndex} 
                                                    className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-white shadow-lg cursor-pointer hover:scale-105 transition-transform duration-200"
                                                    onClick={() => openImageModal(imageUrl)}
                                                    title="Click para ver imagen completa"
                                                >
                                                    {imageUrl.startsWith('data:image/') ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={imageUrl}
                                                            alt={`Producto ${index + 1} - Imagen ${imageIndex + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Image
                                                            src={imageUrl}
                                                            alt={`Producto ${index + 1} - Imagen ${imageIndex + 1}`}
                                                            fill
                                                            sizes="48px"
                                                            className="object-cover"
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                            {product.product_images.length > 3 && (
                                                <div className="w-12 h-12 rounded-lg bg-gray-800 bg-opacity-75 border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-200">
                                                    <span className="text-white text-xs font-bold">+{product.product_images.length - 3}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            );
                        })}
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

            {/* Image Modal */}
            {isModalOpen && selectedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
                     onClick={closeImageModal}>
                    <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden"
                         onClick={(e) => e.stopPropagation()}>
                        {/* Close button */}
                        <button
                            onClick={closeImageModal}
                            className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors shadow-lg"
                        >
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        
                        {/* Image */}
                        <div className="relative w-full h-full">
                            {selectedImage.startsWith('data:image/') ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={selectedImage}
                                    alt="Imagen del producto"
                                    className="max-w-full max-h-[80vh] object-contain"
                                />
                            ) : (
                                <div className="relative" style={{ width: '800px', height: '600px' }}>
                                    <Image
                                        src={selectedImage}
                                        alt="Imagen del producto"
                                        fill
                                        sizes="800px"
                                        className="object-contain"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
