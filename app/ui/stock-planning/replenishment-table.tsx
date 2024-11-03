'use client';
import { useEffect, useState, useMemo } from 'react';
import { CardSkeleton } from '../skeletons';
import { ReplenishmentData } from '@/app/lib/definitions';

export default function ReplenishmentTable({ startDate, endDate }: { startDate: string; endDate: string }) {
  const [replenishmentData, setReplenishmentData] = useState<ReplenishmentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

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

    const storesToReplenish = Array.from(new Set(replenishmentData
      .filter(item => item.REPLENISHMENT > 0)
      .map(item => item.STORE)
    ));

    const replenishmentByStore = replenishmentData.reduce((acc, item) => {
      if (item.REPLENISHMENT > 0) {
        acc[item.STORE] = (acc[item.STORE] || 0) + item.REPLENISHMENT;
      }
      return acc;
    }, {} as Record<string, number>);

    return { totalReplenishment, totalSales, storesToReplenish, replenishmentByStore, totalInOrdered };
  }, [replenishmentData]);

  // Filtering the data only after replenishmentData is loaded
  const filteredData = useMemo(() => {
    if (loading) return []; // Prevent filtering while loading
    return query
      ? replenishmentData.filter(item =>
            item.SKU.toUpperCase().includes(query.toUpperCase()) ||
            item.STORE.toUpperCase().includes(query.toUpperCase())
        )
      : replenishmentData;
  }, [query, replenishmentData, loading]);

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar SKU..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border rounded p-2 w-full"
        />
      </div>

      {loading ? (
        <CardSkeleton />
      ) : (
        <>
        {/* Table */}
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr>
                <th className="border px-4 py-2">SKU</th>
                <th className="border px-4 py-2">Tienda</th>
                <th className="border px-4 py-2">Segmentación</th>
                <th className="border px-4 py-2">Venta</th>
                <th className="border px-4 py-2">Stock Actual</th>
                <th className="border px-4 py-2">Ordenado</th>
                <th className="border px-4 py-2">Reposición</th>
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
        <div className="p-4 my-4 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">Resumen de Reposición</h3>
          <p>Total de Unidades a Reponer: {summary.totalReplenishment}</p>
          <p>Total de Unidades en reposición: {summary.totalInOrdered}</p>
          <p>Total de Unidades Vendidas (Periodo): {summary.totalSales}</p>
          <p>Ubicaciones a Reponer: {summary.storesToReplenish.join(', ') || 'Ninguna'}</p>
          <h4 className="mt-4 font-semibold">Reposición por Ubicación:</h4>
          <ul>
            {Object.entries(summary.replenishmentByStore).map(([store, replenishment]) => (
              <li key={store}>{store}: {replenishment} unidades</li>
            ))}
          </ul>
        </div>
        </>
      )}
    </div>
  );
}
