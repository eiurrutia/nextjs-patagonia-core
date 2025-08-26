'use client';
import { useState } from 'react';
import { 
    CheckCircleIcon, 
    TruckIcon, 
    ReceiptRefundIcon, 
    ArrowDownIcon, 
    BuildingStorefrontIcon,
    DocumentCheckIcon,
    CubeIcon
} from '@heroicons/react/24/solid';

// Definir todos los estados posibles
type TradeInStatus = 
    | 'solicitud_recibida'      // Solicitud recibida
    | 'etiqueta_enviada'        // Etiqueta enviada 
    | 'recepcionado_tienda'     // Recepcionado en tienda
    | 'credito_entregado'       // Crédito entregado
    | 'factura_enviada'         // Factura enviada
    | 'enviado_vestua';         // Enviado a Vestua

type DeliveryMethod = 'shipping' | 'pickup' | 'store';

interface StatusConfig {
    key: TradeInStatus;
    label: string;
    icon: JSX.Element;
    color: string;
}

const statusConfigs: Record<TradeInStatus, StatusConfig> = {
    solicitud_recibida: {
        key: 'solicitud_recibida',
        label: 'Solicitud recibida',
        icon: <CheckCircleIcon className="h-8 w-8" />,
        color: 'text-blue-500'
    },
    etiqueta_enviada: {
        key: 'etiqueta_enviada',
        label: 'Etiqueta enviada',
        icon: <TruckIcon className="h-8 w-8" />,
        color: 'text-indigo-500'
    },
    recepcionado_tienda: {
        key: 'recepcionado_tienda',
        label: 'Recepcionado en tienda',
        icon: <BuildingStorefrontIcon className="h-8 w-8" />,
        color: 'text-green-500'
    },
    credito_entregado: {
        key: 'credito_entregado',
        label: 'Crédito entregado',
        icon: <ReceiptRefundIcon className="h-8 w-8" />,
        color: 'text-yellow-500'
    },
    factura_enviada: {
        key: 'factura_enviada',
        label: 'Factura enviada',
        icon: <DocumentCheckIcon className="h-8 w-8" />,
        color: 'text-purple-500'
    },
    enviado_vestua: {
        key: 'enviado_vestua',
        label: 'Enviado a Vestua',
        icon: <CubeIcon className="h-8 w-8" />,
        color: 'text-gray-600'
    }
};

// Flujos de estados según el tipo de entrega
const ecomFlow: TradeInStatus[] = [
    'solicitud_recibida',
    'etiqueta_enviada', 
    'recepcionado_tienda',
    'credito_entregado',
    'factura_enviada',
    'enviado_vestua'
];

const storeFlow: TradeInStatus[] = [
    'recepcionado_tienda',
    'credito_entregado',
    'factura_enviada',
    'enviado_vestua'
];

interface StatusDisplayProps {
    currentStatus: TradeInStatus;
    deliveryMethod: DeliveryMethod;
    tradeInId: string;
    onStatusChange?: (newStatus: TradeInStatus) => void;
}

export default function StatusDisplay({ 
    currentStatus, 
    deliveryMethod, 
    tradeInId,
    onStatusChange 
}: StatusDisplayProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Determinar qué flujo usar según el método de entrega
    const statusFlow = deliveryMethod === 'store' ? storeFlow : ecomFlow;
    
    // Encontrar el índice del estado actual
    const currentIndex = statusFlow.indexOf(currentStatus);
    
    const handleStatusClick = async (newStatus: TradeInStatus) => {
        if (isUpdating) return;
        
        setIsUpdating(true);
        try {
            const response = await fetch(`/api/trade-in/${tradeInId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });
            
            if (response.ok) {
                onStatusChange?.(newStatus);
            } else {
                console.error('Error updating status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-6">
            {statusFlow.map((status, index) => {
                const config = statusConfigs[status];
                const isActive = index <= currentIndex;
                const isCurrent = status === currentStatus;
                const isClickable = index <= currentIndex + 1; // Permitir avanzar solo al siguiente estado
                
                return (
                    <div key={status} className="flex flex-col items-center space-y-2">
                        <div 
                            className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
                                isCurrent 
                                    ? `${config.color} bg-blue-50 border-2 border-blue-200` 
                                    : isActive 
                                    ? `${config.color} bg-gray-50`
                                    : 'text-gray-300'
                            } ${isClickable ? 'hover:bg-gray-100' : 'cursor-not-allowed'}`}
                            onClick={() => isClickable && handleStatusClick(status)}
                        >
                            <div className={isActive ? config.color : 'text-gray-300'}>
                                {config.icon}
                            </div>
                            <p className={`font-medium ${
                                isCurrent ? 'text-blue-700' : isActive ? 'text-gray-700' : 'text-gray-400'
                            }`}>
                                {config.label}
                            </p>
                            {isCurrent && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                        </div>
                        {index < statusFlow.length - 1 && (
                            <ArrowDownIcon className={`h-6 w-6 ${
                                index < currentIndex ? 'text-green-400' : 'text-gray-300'
                            }`} />
                        )}
                    </div>
                );
            })}
            
            {isUpdating && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span>Actualizando estado...</span>
                </div>
            )}
        </div>
    );
}
