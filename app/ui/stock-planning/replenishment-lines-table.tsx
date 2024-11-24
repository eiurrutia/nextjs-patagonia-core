'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { ReplenishmentLine } from '@/app/lib/definitions';
import { useParams } from 'next/navigation';
import { CardSkeleton } from '@/app/ui/skeletons';
import Pagination from '@/app/ui/pagination';

export default function ReplenishmentLinesTable() {
  const params = useParams() as { id?: string };
  const id = params?.id;
  const [lines, setLines] = useState<ReplenishmentLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof ReplenishmentLine; direction: 'asc' | 'desc' } | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    async function fetchReplenishmentLines() {
      if (!id) return;
      setLoading(true);
      try {
        const response = await fetch(`/api/stock-planning/replenishment-lines?id=${id}`);
        const data = await response.json();
        setLines(data);
      } catch (error) {
        console.error('Error fetching replenishment lines:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReplenishmentLines();
  }, [id]);

  const sortedLines = useMemo(() => {
    if (!sortConfig) return lines;
    const sorted = [...lines];
    sorted.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === undefined || bValue === undefined) return 0;
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [lines, sortConfig]);

  const paginatedLines = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedLines.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedLines, currentPage]);

  const handleSort = (key: keyof ReplenishmentLine) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  if (loading) return <CardSkeleton />;
  if (!lines.length) return <p className="text-center text-gray-600">No hay líneas de reposición para esta ID.</p>;

  return (
    <div>
      <table className="min-w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr>
            <th
              className="border px-4 py-2 cursor-pointer"
              onClick={() => handleSort('SKU')}
            >
              SKU {sortConfig?.key === 'SKU' && (sortConfig.direction === 'asc' ? '🔼' : '🔽')}
            </th>
            <th
              className="border px-4 py-2 cursor-pointer"
              onClick={() => handleSort('STORE')}
            >
              Tienda {sortConfig?.key === 'STORE' && (sortConfig.direction === 'asc' ? '🔼' : '🔽')}
            </th>
            <th
              className="border px-4 py-2 cursor-pointer"
              onClick={() => handleSort('SEGMENT')}
            >
              Segmentación {sortConfig?.key === 'SEGMENT' && (sortConfig.direction === 'asc' ? '🔼' : '🔽')}
            </th>
            <th
              className="border px-4 py-2 cursor-pointer"
              onClick={() => handleSort('SALES')}
            >
              Ventas {sortConfig?.key === 'SALES' && (sortConfig.direction === 'asc' ? '🔼' : '🔽')}
            </th>
            <th
              className="border px-4 py-2 cursor-pointer"
              onClick={() => handleSort('ACTUAL_STOCK')}
            >
              Stock Actual {sortConfig?.key === 'ACTUAL_STOCK' && (sortConfig.direction === 'asc' ? '🔼' : '🔽')}
            </th>
            <th
              className="border px-4 py-2 cursor-pointer"
              onClick={() => handleSort('ORDERED_QTY')}
            >
              Ordenado {sortConfig?.key === 'ORDERED_QTY' && (sortConfig.direction === 'asc' ? '🔼' : '🔽')}
            </th>
            <th
              className="border px-4 py-2 cursor-pointer"
              onClick={() => handleSort('REPLENISHMENT')}
            >
              Reposición {sortConfig?.key === 'REPLENISHMENT' && (sortConfig.direction === 'asc' ? '🔼' : '🔽')}
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedLines.map((line, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="border px-4 py-2">{line.SKU}</td>
              <td className="border px-4 py-2">{line.STORE}</td>
              <td className="border px-4 py-2">{line.SEGMENT}</td>
              <td className="border px-4 py-2">{line.SALES}</td>
              <td className="border px-4 py-2">{line.ACTUAL_STOCK}</td>
              <td className="border px-4 py-2">{line.ORDERED_QTY}</td>
              <td className="border px-4 py-2">{line.REPLENISHMENT}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="mt-5 flex w-full justify-center">
        <Pagination
          totalPages={Math.ceil(sortedLines.length / itemsPerPage)}
          currentPage={currentPage}
          setPage={setCurrentPage}
        />
      </div>
    </div>
  );
}
