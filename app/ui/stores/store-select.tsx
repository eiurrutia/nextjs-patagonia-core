'use client';
import { useState, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface Store {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  region?: string;
}

interface StoreSelectProps {
  value: string;
  onChange: (storeCode: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function StoreSelect({ value, onChange, disabled = false, placeholder = "Seleccionar tienda..." }: StoreSelectProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stores');
      
      if (!response.ok) {
        throw new Error('Error fetching stores');
      }
      
      const data = await response.json();
      setStores(data.stores || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
      setError('Error al cargar las tiendas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="relative">
        <select 
          disabled 
          className="block w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-500"
        >
          <option>Cargando tiendas...</option>
        </select>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative">
        <select 
          disabled 
          className="block w-full rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-500"
        >
          <option>{error}</option>
        </select>
      </div>
    );
  }

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`block w-full rounded-md border px-3 py-2 text-sm ${
          disabled 
            ? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed' 
            : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500'
        } appearance-none`}
      >
        <option value="">{placeholder}</option>
        {stores.map((store) => (
          <option key={store.id} value={store.code}>
            {store.name} - {store.city}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}
