'use client';
import { useEffect, useState } from 'react';
import { CardSkeleton } from '../skeletons';
import { StockData } from '@/app/lib/definitions';

interface StockTableProps {
  query: string;
  currentPage: number;
}

export default function StockTable({ query, currentPage }: StockTableProps) {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(currentPage);

  useEffect(() => {
    async function fetchStockData() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/stock-planning/stock?query=${encodeURIComponent(query)}&page=${page}`
        );
        const data: StockData[] = await response.json();
        setStockData(data);
      } catch (error) {
        console.error('Error fetching stock data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStockData();
  }, [query, page]);

  if (loading) return <CardSkeleton />;

  return (
    <div className="w-full overflow-auto mt-4">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border px-4 py-2">SKU</th>
            <th className="border px-4 py-2">Stock ERP</th>
            <th className="border px-4 py-2">Stock WMS</th>
            <th className="border px-4 py-2">MIN</th>
          </tr>
        </thead>
        <tbody>
          {stockData.map((stock) => (
            <tr key={stock.SKU}>
              <td className="border px-4 py-2">{stock.SKU}</td>
              <td className="border px-4 py-2">{stock.STOCKERP}</td>
              <td className="border px-4 py-2">{stock.STOCKWMS}</td>
              <td className="border px-4 py-2">{stock.MINSTOCK}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
