'use client';
import { useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { TruckIcon, ReceiptRefundIcon } from '@heroicons/react/24/outline';

export default function StatusIcons({ status }: { status: string }) {
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);

  const getIconStyle = (currentStatus: string) =>
    status === currentStatus ? 'text-blue-500' : 'text-gray-300';

  const getStatusLabel = (currentStatus: string) => {
    switch (currentStatus) {
      case 'Etiqueta Enviada':
        return 'Etiqueta Enviada';
      case 'Producto Entregado':
        return 'Producto Entregado';
      case 'Crédito Entregado':
        return 'Crédito Entregado';
      default:
        return '';
    }
  };

  const handleMouseEnter = (status: string) => setHoveredStatus(status);
  const handleMouseLeave = () => setHoveredStatus(null);

  return (
    <div className="flex space-x-4">
      <div
        onMouseEnter={() => handleMouseEnter('Etiqueta Enviada')}
        onMouseLeave={handleMouseLeave}
        className="relative"
      >
        <CheckCircleIcon className={`h-6 w-6 ${getIconStyle('Etiqueta Enviada')}`} />
        {hoveredStatus === 'Etiqueta Enviada' && (
          <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 w-max bg-black text-white text-xs rounded px-2 py-1 z-50 shadow-lg">
            {getStatusLabel('Etiqueta Enviada')}
          </span>
        )}
      </div>

      <div
        onMouseEnter={() => handleMouseEnter('Producto Entregado')}
        onMouseLeave={handleMouseLeave}
        className="relative"
      >
        <TruckIcon className={`h-6 w-6 ${getIconStyle('Producto Entregado')}`} />
        {hoveredStatus === 'Producto Entregado' && (
          <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 w-max bg-black text-white text-xs rounded px-2 py-1 z-50 shadow-lg">
            {getStatusLabel('Producto Entregado')}
          </span>
        )}
      </div>

      <div
        onMouseEnter={() => handleMouseEnter('Crédito Entregado')}
        onMouseLeave={handleMouseLeave}
        className="relative"
      >
        <ReceiptRefundIcon className={`h-6 w-6 ${getIconStyle('Crédito Entregado')}`} />
        {hoveredStatus === 'Crédito Entregado' && (
          <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 w-max bg-black text-white text-xs rounded px-2 py-1 z-50 shadow-lg">
            {getStatusLabel('Crédito Entregado')}
          </span>
        )}
      </div>
    </div>
  );
}
