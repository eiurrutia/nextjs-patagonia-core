'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { CardSkeleton } from '../skeletons';
import Pagination from '../pagination';
import { SalesData } from '@/app/lib/definitions';

interface SalesTableProps {
  startDate: string;
  endDate: string;
  query: string;
  currentPage: number;
  setPage: (page: number) => void;
}

export default function SalesTable({ startDate, endDate, query, currentPage, setPage }: SalesTableProps) {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const limit = 10;

  useEffect(() => {
    async function fetchSalesData() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/stock-planning/sales?startDate=${startDate}&endDate=${endDate}&query=${encodeURIComponent(
            query
          )}&page=${currentPage}&sortKey=${sortConfig?.key || ''}&sortDirection=${sortConfig?.direction || ''}`
        );
        const data: SalesData[] = await response.json();
        setSalesData(data);
      } catch (error) {
        console.error('Error fetching sales data:', error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchTotalPages() {
      try {
        const response = await fetch(
          `/api/stock-planning/sales-count?startDate=${startDate}&endDate=${endDate}&query=${encodeURIComponent(query)}`
        );
        const { totalCount } = await response.json();
        setTotalPages(Math.ceil(totalCount / limit));
      } catch (error) {
        console.error('Error fetching total pages:', error);
      }
    }

    fetchSalesData();
    fetchTotalPages();
  }, [startDate, endDate, query, currentPage, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    let sortableData = [...salesData];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof SalesData];
        const bValue = b[sortConfig.key as keyof SalesData];

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
  }, [salesData, sortConfig]);

  if (loading) return <CardSkeleton />;

  return (
    <div className="w-full overflow-auto mt-4">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            {[
              'SKU',
              'CD',
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
            ].map((column) => (
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
          {sortedData.map((sale) => (
            <tr key={sale.SKU}>
              <td className="border px-4 py-2">{sale.SKU}</td>
              <td className="border px-4 py-2">{sale.CD}</td>
              <td className="border px-4 py-2">{sale.COYHAIQUE}</td>
              <td className="border px-4 py-2">{sale.LASCONDES}</td>
              <td className="border px-4 py-2">{sale.MALLSPORT}</td>
              <td className="border px-4 py-2">{sale.COSTANERA}</td>
              <td className="border px-4 py-2">{sale.CONCEPCION}</td>
              <td className="border px-4 py-2">{sale.PTOVARAS}</td>
              <td className="border px-4 py-2">{sale.LADEHESA}</td>
              <td className="border px-4 py-2">{sale.PUCON}</td>
              <td className="border px-4 py-2">{sale.TEMUCO}</td>
              <td className="border px-4 py-2">{sale.OSORNO}</td>
              <td className="border px-4 py-2">{sale.ALERCE}</td>
              <td className="border px-4 py-2">{sale.BNAVENTURA}</td>
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
