'use client';
import { CheckCircleIcon, TruckIcon, ReceiptRefundIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

const statusColors: Record<'Etiqueta Enviada' | 'Producto Entregado' | 'Crédito Entregado', string> = {
    "Etiqueta Enviada": "text-blue-500",
    "Producto Entregado": "text-green-500",
    "Crédito Entregado": "text-yellow-500"
};

const statusIcons: Record<'Etiqueta Enviada' | 'Producto Entregado' | 'Crédito Entregado', JSX.Element> = {
    "Etiqueta Enviada": <CheckCircleIcon className="h-8 w-8" />,
    "Producto Entregado": <TruckIcon className="h-8 w-8" />,
    "Crédito Entregado": <ReceiptRefundIcon className="h-8 w-8" />
};

const statuses = ["Etiqueta Enviada", "Producto Entregado", "Crédito Entregado"] as const;

interface StatusDisplayProps {
    currentStatus: 'Etiqueta Enviada' | 'Producto Entregado' | 'Crédito Entregado';
}


export default function StatusDisplay({ currentStatus }: StatusDisplayProps) {
    return (
        <div className="flex flex-col items-center space-y-8">
            {statuses.map((status, index) => (
                <div key={status} className="flex flex-col items-center space-y-2">
                    <div className={`flex items-center space-x-2 ${status === currentStatus ? statusColors[status] : 'text-gray-300'}`}>
                        {statusIcons[status]}
                        <p className={`font-medium ${status === currentStatus ? '' : 'text-gray-400'}`}>{status}</p>
                    </div>
                    {index < statuses.length - 1 && (
                        <ArrowDownIcon className="h-6 w-6 text-gray-400" />
                    )}
                </div>
            ))}
        </div>
    );
}
