'use client';
import { useState, useEffect } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { TruckIcon, ReceiptRefundIcon } from '@heroicons/react/24/outline';

export default function StatusSelector({ tradeInId }: { tradeInId: string }) {
  const [status, setStatus] = useState<string>('Etiqueta Enviada');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch the current status when the component loads
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/trade-in/${tradeInId}/status`);
        const data = await res.json();
        setStatus(data.status || 'Etiqueta Enviada');
      } catch (error) {
        console.error('Error fetching status:', error);
      }
    };

    fetchStatus();
  }, [tradeInId]);

  // Handle status change and send the update to the server
  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    setIsSaving(true);

    try {
      const res = await fetch(`/api/trade-in/${tradeInId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      setIsSaving(false);
    } catch (error) {
      console.error('Error updating status:', error);
      setIsSaving(false);
    }
  };

  // Get the icon style based on the current status
  const getIconStyle = (currentStatus: string) => {
    return status === currentStatus ? 'text-blue-500' : 'text-gray-300';
  };

  return (
    <div className="w-full flex justify-between items-center mb-6">
      {/* Status selector */}
      <div className="w-1/3 px-3">
        <h2 className="text-lg font-semibold">Estado del Trade-In</h2>
        <select
          className="block w-full rounded-md border py-2 px-3 text-sm"
          value={status}
          onChange={handleStatusChange}
          disabled={isSaving} // Disable during save
        >
          <option value="Etiqueta Enviada">Etiqueta Enviada</option>
          <option value="Producto Entregado">Producto Entregado</option>
          <option value="Crédito Entregado">Crédito Entregado</option>
        </select>
        {isSaving && <p className="text-sm text-gray-500">Guardando...</p>}
      </div>

      {/* Status icons */}
      <div className="flex space-x-4 justify-end w-2/3">
        <CheckCircleIcon className={`h-8 w-8 ${getIconStyle('Etiqueta Enviada')}`} />
        <TruckIcon className={`h-8 w-8 ${getIconStyle('Producto Entregado')}`} />
        <ReceiptRefundIcon className={`h-8 w-8 ${getIconStyle('Crédito Entregado')}`} />
      </div>
    </div>
  );
}
