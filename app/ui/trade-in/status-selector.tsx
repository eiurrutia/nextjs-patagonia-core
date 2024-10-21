'use client';
import { useState } from 'react';

type TradeInStatus = 'Etiqueta Enviada' | 'Producto Entregado' | 'Crédito Entregado';
const statuses: TradeInStatus[] = ['Etiqueta Enviada', 'Producto Entregado', 'Crédito Entregado'];

interface StatusSelectorProps {
    tradeInId: string;
    status: string;
    setStatus: (status: TradeInStatus) => void;
}

export default function StatusSelector({ tradeInId, status, setStatus }: StatusSelectorProps) {
    const [isSaving, setIsSaving] = useState(false);

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as TradeInStatus;
        setStatus(newStatus);
        setIsSaving(true);

        try {
            const res = await fetch(`/api/trade-in/${tradeInId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) throw new Error('Failed to update status');
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
      <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
              <h2 className="text-base font-semibold">Modificar Estado</h2>
          </div>
          <select
              className="w-1/3 rounded-md border py-2 px-3 text-sm"
              value={status}
              onChange={handleStatusChange}
              disabled={isSaving}
          >
              {statuses.map((s) => (
                  <option key={s} value={s}>
                      {s}
                  </option>
              ))}
          </select>
          {isSaving && (
              <p className="text-sm text-gray-500 ml-4">Guardando...</p>
          )}
      </div>
  );
}
