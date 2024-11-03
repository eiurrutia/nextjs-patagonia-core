'use client';
import { useEffect, useState, useMemo } from 'react';
import { CardSkeleton } from '../skeletons';
import { ReplenishmentData } from '@/app/lib/definitions';

export default function ReplenishmentTable({ startDate, endDate }: { startDate: string; endDate: string }) {
  const [replenishmentData, setReplenishmentData] = useState<ReplenishmentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof ReplenishmentData; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    async function fetchReplenishmentData() {
      setLoading(true);
      try {
        const response = await fetch(`/api/stock-planning/replenishment?startDate=${startDate}&endDate=${endDate}`);
        const data = await response.json();
        setReplenishmentData(data);
      } catch (error) {
        console.error('Error fetching replenishment data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReplenishmentData();
  }, [startDate, endDate]);

  // Calculate summary data
  const summary = useMemo(() => {
    const totalReplenishment = replenishmentData.reduce((sum, item) => sum + (item.REPLENISHMENT || 0), 0);
    const totalSales = replenishmentData.reduce((sum, item) => sum + (item.SALES || 0), 0);
    const totalInOrdered = replenishmentData.reduce((sum, item) => sum + (item.ORDERED_QTY || 0), 0);
    const replenishmentByStore = replenishmentData.reduce((acc, item) => {
      if (item.REPLENISHMENT > 0) {
        acc[item.STORE] = (acc[item.STORE] || 0) + item.REPLENISHMENT;
      }
      return acc;
    }, {} as Record<string, number>);

    return { totalReplenishment, totalSales, replenishmentByStore, totalInOrdered };
  }, [replenishmentData]);

  // Filtering and sorting the data
  const filteredData = useMemo(() => {
    let data = replenishmentData;
    if (query) {
      data = data.filter(item =>
            item.SKU.toUpperCase().includes(query.toUpperCase()) ||
            item.STORE.toUpperCase().includes(query.toUpperCase())
      );
    }

    if (sortConfig) {
      data = [...data].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [query, replenishmentData, sortConfig]);

  const handleSort = (key: keyof ReplenishmentData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div>
      {loading ? (
        <CardSkeleton />
      ) : (
        <>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar SKU, Tienda..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border rounded p-2 w-full"
          />
        </div>
        {/* Table */}
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('SKU')}>SKU</th>
              <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('STORE')}>Tienda</th>
                <th className="border px-4 py-2">Segmentación</th>
                <th className="border px-4 py-2">Venta</th>
                <th className="border px-4 py-2">Stock Actual</th>
                <th className="border px-4 py-2">Ordenado</th>
              <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('REPLENISHMENT')}>
                Reposición
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData.slice(0, 20).map((item, index) => (
                <tr key={`${item.SKU}-${item.STORE || index}`}>
                    <td className="border px-4 py-2">{item.SKU}</td>
                    <td className="border px-4 py-2">{item.STORE}</td>
                    <td className="border px-4 py-2">{item.SEGMENT}</td>
                    <td className="border px-4 py-2">{item.SALES}</td>
                    <td className="border px-4 py-2">{item.ACTUAL_STOCK}</td>
                    <td className="border px-4 py-2">{item.ORDERED_QTY}</td>
                    <td className="border px-4 py-2">{item.REPLENISHMENT}</td>
                </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Card */}
        <div className="p-6 my-6 rounded-lg shadow-md">
          <h3 className="text-2xl font-bold mb-4 text-center">Resumen de Reposición</h3>
          <div className="flex justify-around text-center">
            <div className="flex flex-col items-center">
              <p className="text-4xl font-bold text-blue-600">{summary.totalReplenishment}</p>
              <p className="text-sm text-gray-600">Total de Unidades a Reponer</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-4xl font-bold text-yellow-600">{summary.totalInOrdered}</p>
              <p className="text-sm text-gray-600">Total de Unidades en Reposición</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-4xl font-bold">{summary.totalSales}</p>
              <p className="text-sm text-gray-600">Total de Unidades Vendidas (Periodo)</p>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="font-semibold">Reposición por Ubicación:</h4>
            <ul className="ml-4 list-disc">
            {Object.entries(summary.replenishmentByStore).map(([store, replenishment]) => (
                <li key={store} className="text-gray-700">{store}: {replenishment} unidades</li>
            ))}
          </ul>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
