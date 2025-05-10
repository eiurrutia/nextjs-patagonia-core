'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { CardSkeleton } from '../skeletons';
import { CDStockData } from '@/app/lib/definitions';
import Pagination from '@/app/ui/pagination';

interface CDStockTableProps {
  query: string;
  currentPage: number;
  setPage: (page: number) => void;
}

export default function CDStockTable({ query, currentPage, setPage }: CDStockTableProps) {
  const [stockData, setStockData] = useState<CDStockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const limit = 10;

  useEffect(() => {
    async function fetchCDStockData() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/stock-planning/stock-cd?query=${encodeURIComponent(query)}&page=${currentPage}&sortKey=${sortConfig?.key || ''}&sortDirection=${sortConfig?.direction || ''}`
        );
        const data: CDStockData[] = await response.json();
        setStockData(data);
      } catch (error) {
        console.error('Error fetching stock data:', error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchTotalPages() {
      try {
        const response = await fetch(
          `/api/stock-planning/stock-cd-count?query=${encodeURIComponent(query)}`
        );
        const { totalCount } = await response.json();
        setTotalPages(Math.ceil(totalCount / limit));
      } catch (error) {
        console.error('Error fetching total pages:', error);
      }
    }

    fetchCDStockData();
    fetchTotalPages();
  }, [query, currentPage, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    let sortableData = [...stockData];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof CDStockData];
        const bValue = b[sortConfig.key as keyof CDStockData];

        const aValueNum = Number(aValue);
        const bValueNum = Number(bValue);

        if (!isNaN(aValueNum) && !isNaN(bValueNum)) {
          // Numeric comparison
          return sortConfig.direction === 'asc' ? aValueNum - bValueNum : bValueNum - aValueNum;
        } else {
          // String comparison
          const aStr = String(aValue);
          const bStr = String(bValue);
          if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        }
      });
    }
    return sortableData;
  }, [stockData, sortConfig]);

  if (loading) return <CardSkeleton />;

  return (
    <div className="w-full overflow-auto mt-4">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            {['SKU', 'STOCKERP', 'STOCKWMS', 'MINSTOCK'].map((column) => (
              <th
                key={column}
                className="border px-4 py-2 cursor-pointer"
                onClick={() => handleSort(column)}
              >
                {column} {sortConfig?.key === column && (sortConfig.direction === 'asc' ? '🔼' : '🔽')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((stock) => (
            <tr key={stock.SKU}>
              <td className="border px-4 py-2">{stock.SKU}</td>
              <td className="border px-4 py-2">{stock.STOCKERP}</td>
              <td className="border px-4 py-2">{stock.STOCKWMS}</td>
              <td className="border px-4 py-2">{stock.MINSTOCK}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} currentPage={currentPage} setPage={setPage} />
      </div>
    </div>
  );
}
