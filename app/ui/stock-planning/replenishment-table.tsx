'use client';
import { useEffect, useState, useMemo } from 'react';
import { CardSkeleton } from '../skeletons';
import { ReplenishmentData, BreakData } from '@/app/lib/definitions';

export default function ReplenishmentTable({ startDate, endDate }: { startDate: string; endDate: string }) {
  const [replenishmentData, setReplenishmentData] = useState<ReplenishmentData[]>([]);
  const [breakData, setBreakData] = useState<BreakData[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof ReplenishmentData; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    async function fetchReplenishmentData() {
      setLoading(true);
      try {
        const response = await fetch(`/api/stock-planning/replenishment?startDate=${startDate}&endDate=${endDate}`);
        const data = await response.json();
        setReplenishmentData(data.replenishmentTable);
        setBreakData(data.breakData);
      } catch (error) {
        console.error('Error fetching replenishment data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReplenishmentData();
  }, [startDate, endDate]);

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
    const totalBreakQty = breakData.reduce((sum, item) => sum + item.BREAK_QTY, 0);
    const breakByStore = breakData.reduce((acc, item) => {
      acc[item.STORE] = (acc[item.STORE] || 0) + item.BREAK_QTY;
      return acc;
    }, {} as Record<string, number>);
    const breakByStoreSku = breakData.reduce((acc, item) => {
      if (!acc[item.STORE]) acc[item.STORE] = {};
      acc[item.STORE][item.SKU] = (acc[item.STORE][item.SKU] || 0) + item.BREAK_QTY;
      return acc;
    }, {} as Record<string, Record<string, number>>);

    return { totalReplenishment, totalSales, replenishmentByStore, totalInOrdered, totalBreakQty, breakByStore, breakByStoreSku };
  }, [replenishmentData, breakData]);

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
        <div className="my-4">
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
              <th className="border px-4 py-2 cursor-pointer"  onClick={() => handleSort('SEGMENT')}>Segmentación</th>
              <th className="border px-4 py-2 cursor-pointer"  onClick={() => handleSort('SALES')}>Venta</th>
              <th className="border px-4 py-2 cursor-pointer"  onClick={() => handleSort('ACTUAL_STOCK')}>Stock Actual</th>
              <th className="border px-4 py-2 cursor-pointer"  onClick={() => handleSort('ORDERED_QTY')}>Ordenado</th>
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
            <div className="flex flex-col items-center">
              <p className="text-4xl font-bold text-red-600">{summary.totalBreakQty}</p>
              <p className="text-sm text-red-600">Total de Unidades en Quiebre</p>
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
          <div className="mt-4">
            <h4 className="font-semibold">Quiebre por Ubicación:</h4>
            <ul className="ml-4 list-disc">
              {Object.entries(summary.breakByStore).map(([store, breakQty]) => (
                <li key={store} className="text-gray-700">{store}: {breakQty} unidades en quiebre</li>
              ))}
            </ul>
          </div>
          <div className="mt-4">
            <h4 className="font-semibold">Quiebre por SKU en cada Tienda:</h4>
            {Object.entries(summary.breakByStoreSku).map(([store, skuData]) => (
              <div key={store} className="ml-4">
                <h5 className="text-gray-700 font-semibold">{store}:</h5>
                <ul className="list-disc ml-4">
                  {Object.entries(skuData).map(([sku, breakQty]) => (
                    <li key={`${store}-${sku}`} className="text-gray-700">{sku}: {breakQty} unidades en quiebre</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        </>
      )}
    </div>
  );
}
