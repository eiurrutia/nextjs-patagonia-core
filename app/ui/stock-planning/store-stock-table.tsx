'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { CardSkeleton } from '../skeletons';
import { StoresStockData } from '@/app/lib/definitions';
import Pagination from '../pagination';

interface StoresStockTableProps {
  query: string;
  currentPage: number;
  setPage: (page: number) => void;
}

export default function StoresStockTable({ query, currentPage, setPage }: StoresStockTableProps) {
  const [storesStockData, setStoresStockData] = useState<StoresStockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const limit = 10;

  useEffect(() => {
    async function fetchStoresStockData() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/stock-planning/stock-stores?query=${encodeURIComponent(query)}&page=${currentPage}&sortKey=${sortConfig?.key || ''}&sortDirection=${sortConfig?.direction || ''}`
        );
        const data: StoresStockData[] = await response.json();
        setStoresStockData(data);
      } catch (error) {
        console.error('Error fetching stores stock data:', error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchTotalPages() {
      try {
        const response = await fetch(
          `/api/stock-planning/stock-stores-count?query=${encodeURIComponent(query)}`
        );
        const { totalCount } = await response.json();
        setTotalPages(Math.ceil(totalCount / limit));
      } catch (error) {
        console.error('Error fetching total pages:', error);
      }
    }

    fetchStoresStockData();
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
    let sortableData = [...storesStockData];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof StoresStockData];
        const bValue = b[sortConfig.key as keyof StoresStockData];

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
  }, [storesStockData, sortConfig]);

  if (loading) return <CardSkeleton />;

  return (
    <div className="w-full overflow-auto mt-4">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th
              className="border px-4 py-2 cursor-pointer"
              onClick={() => handleSort('SKU')}
            >
              SKU {sortConfig?.key === 'SKU' && (sortConfig.direction === 'asc' ? '🔼' : '🔽')}
            </th>
            {[
              'COYHAIQUE',
              'LASCONDES',
              'MALLSPORT',
              'COSTANERA',
              'CONCEPCION',
              'PTOVARAS',
              'LADEHESA',
              'PUCON',
              'TEMUCO',
              'OSORNO',
              'ALERCE',
              'BNAVENTURA',
            ].map((store) => (
              <th
                key={store}
                className="border px-4 py-2 cursor-pointer"
                onClick={() => handleSort(`${store}_AVAILABLE`)}
              >
                {store} {sortConfig?.key === `${store}_AVAILABLE` && (sortConfig.direction === 'asc' ? '🔼' : '🔽')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((storeStock, index) => (
            <tr key={index}>
              <td className="border px-4 py-2">{storeStock.SKU}</td>
              {[
                'COYHAIQUE',
                'LASCONDES',
                'MALLSPORT',
                'COSTANERA',
                'CONCEPCION',
                'PTOVARAS',
                'LADEHESA',
                'PUCON',
                'TEMUCO',
                'OSORNO',
                'ALERCE',
                'BNAVENTURA',
              ].map((store) => (
                <td key={store} className="border px-4 py-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg text-black-700">
                      {storeStock[`${store}_AVAILABLE` as keyof StoresStockData]}
                    </span>
                    <span className="text-sm text-gray-500">
                      Ord: {storeStock[`${store}_ORDERED` as keyof StoresStockData]}
                    </span>
                  </div>
                </td>
              ))}
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
