'use client';
import { useEffect, useState } from 'react';
import { CardSkeleton } from '../skeletons';
import { StoresStockData } from '@/app/lib/definitions';

interface StoresStockTableProps {
  query: string;
  currentPage: number;
}

export default function StoresStockTable({ query, currentPage }: StoresStockTableProps) {
  const [storesStockData, setStoresStockData] = useState<StoresStockData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchStoresStockData() {
      setLoading(true);
      try {
        const response = await fetch(`/api/stock-planning/stock-stores?query=${encodeURIComponent(query)}&page=${currentPage}`);
        const data: StoresStockData[] = await response.json();
        setStoresStockData(data);
      } catch (error) {
        console.error('Error fetching stores stock data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStoresStockData();
  }, [query, currentPage]);

  if (loading) return <CardSkeleton />;

  return (
    <div className="w-full overflow-auto mt-4">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border px-4 py-2">SKU</th>
            <th className="border px-4 py-2">COYHAIQUE</th>
            <th className="border px-4 py-2">LASCONDES</th>
            <th className="border px-4 py-2">MALLSPORT</th>
            <th className="border px-4 py-2">COSTANERA</th>
            <th className="border px-4 py-2">CONCEPCION</th>
            <th className="border px-4 py-2">PTOVARAS</th>
            <th className="border px-4 py-2">LADEHESA</th>
            <th className="border px-4 py-2">PUCON</th>
            <th className="border px-4 py-2">TEMUCO</th>
            <th className="border px-4 py-2">OSORNO</th>
            <th className="border px-4 py-2">ALERCE</th>
            <th className="border px-4 py-2">BNAVENTURA</th>
          </tr>
        </thead>
        <tbody>
          {storesStockData.map((storeStock, index) => (
            <tr key={index}>
                <td className="border px-4 py-2">{storeStock.SKU}</td>
                <td className="border px-4 py-2">
                    <div className="flex justify-between items-center">
                    <span className="text-lg text-black-700">{storeStock.COYHAIQUE_AVAILABLE}</span>
                    <span className="text-sm text-gray-500">Ord: {storeStock.COYHAIQUE_ORDERED}</span>
                    </div>
                </td>
                <td className="border px-4 py-2">
                    <div className="flex justify-between items-center">
                    <span className="text-lg text-black-700">{storeStock.LASCONDES_AVAILABLE}</span>
                    <span className="text-sm text-gray-500">Ord: {storeStock.LASCONDES_ORDERED}</span>
                    </div>
                </td>
                <td className="border px-4 py-2">
                    <div className="flex justify-between items-center">
                    <span className="text-lg text-black-700">{storeStock.MALLSPORT_AVAILABLE}</span>
                    <span className="text-sm text-gray-500">Ord: {storeStock.MALLSPORT_ORDERED}</span>
                    </div>
                </td>
                <td className="border px-4 py-2">
                    <div className="flex justify-between items-center">
                    <span className="text-lg text-black-700">{storeStock.COSTANERA_AVAILABLE}</span>
                    <span className="text-sm text-gray-500">Ord: {storeStock.COSTANERA_ORDERED}</span>
                    </div>
                </td>
                <td className="border px-4 py-2">
                    <div className="flex justify-between items-center">
                    <span className="text-lg text-black-700">{storeStock.CONCEPCION_AVAILABLE}</span>
                    <span className="text-sm text-gray-500">Ord: {storeStock.CONCEPCION_ORDERED}</span>
                    </div>
                </td>
                <td className="border px-4 py-2">
                    <div className="flex justify-between items-center">
                    <span className="text-lg text-black-700">{storeStock.PTOVARAS_AVAILABLE}</span>
                    <span className="text-sm text-gray-500">Ord: {storeStock.PTOVARAS_ORDERED}</span>
                    </div>
                </td>
                <td className="border px-4 py-2">
                    <div className="flex justify-between items-center">
                    <span className="text-lg text-black-700">{storeStock.LADEHESA_AVAILABLE}</span>
                    <span className="text-sm text-gray-500">Ord: {storeStock.LADEHESA_ORDERED}</span>
                    </div>
                </td>
                <td className="border px-4 py-2">
                    <div className="flex justify-between items-center">
                    <span className="text-lg text-black-700">{storeStock.PUCON_AVAILABLE}</span>
                    <span className="text-sm text-gray-500">Ord: {storeStock.PUCON_ORDERED}</span>
                    </div>
                </td>
                <td className="border px-4 py-2">
                    <div className="flex justify-between items-center">
                    <span className="text-lg text-black-700">{storeStock.TEMUCO_AVAILABLE}</span>
                    <span className="text-sm text-gray-500">Ord: {storeStock.TEMUCO_ORDERED}</span>
                    </div>
                </td>
                <td className="border px-4 py-2">
                    <div className="flex justify-between items-center">
                    <span className="text-lg text-black-700">{storeStock.OSORNO_AVAILABLE}</span>
                    <span className="text-sm text-gray-500">Ord: {storeStock.OSORNO_ORDERED}</span>
                    </div>
                </td>
                <td className="border px-4 py-2">
                    <div className="flex justify-between items-center">
                    <span className="text-lg text-black-700">{storeStock.ALERCE_AVAILABLE}</span>
                    <span className="text-sm text-gray-500">Ord: {storeStock.ALERCE_ORDERED}</span>
                    </div>
                </td>
                <td className="border px-4 py-2">
                    <div className="flex justify-between items-center">
                    <span className="text-lg text-black-700">{storeStock.BNAVENTURA_AVAILABLE}</span>
                    <span className="text-sm text-gray-500">Ord: {storeStock.BNAVENTURA_ORDERED}</span>
                    </div>
                </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
