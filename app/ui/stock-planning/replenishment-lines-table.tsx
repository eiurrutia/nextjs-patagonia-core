'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { CardSkeleton } from '@/app/ui/skeletons';
import Pagination from '@/app/ui/pagination';

export default function ReplenishmentLinesTable() {
  const params = useParams() as { id?: string };
  const id = params?.id;
  const [lines, setLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [groupBy, setGroupBy] = useState<'SKU' | 'CC' | 'TEAM' | 'CATEGORY'>('SKU');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    async function fetchReplenishmentLines() {
      if (!id) return;
      setLoading(true);
      try {
        const response = await fetch(`/api/stock-planning/replenishment-lines?id=${id}&groupBy=${groupBy}`);
        const data = await response.json();
        setLines(data);
      } catch (error) {
        console.error('Error fetching replenishment lines:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReplenishmentLines();
  }, [id, groupBy]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const sortedLines = useMemo(() => {
    if (!sortConfig) return lines;
    return [...lines].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [lines, sortConfig]);

  const paginatedLines = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedLines.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedLines, currentPage]);

  const downloadCSV = () => {
    if (!lines || lines.length === 0) return;

    const headers = Object.keys(lines[0]).join(',');
    const rows = lines.map((line) =>
      Object.values(line)
        .map((value) => `"${value ?? ''}"`)
        .join(',')
    );

    const csvContent = `${headers}\n${rows.join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `replenishment_lines_${groupBy}_${id}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  if (loading) return <CardSkeleton />;
  if (!lines.length) return <p className="text-center text-gray-600">No hay líneas de reposición para esta ID.</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        {/* Group By Buttons */}
        <div className="flex gap-2">
          {['SKU', 'CC', 'TEAM', 'CATEGORY'].map((option) => (
            <button
              key={option}
              onClick={() => {
                setGroupBy(option as 'SKU' | 'CC' | 'TEAM' | 'CATEGORY');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded ${
                groupBy === option ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
              } hover:bg-blue-400 hover:text-white`}
            >
              Agrupar por {option}
            </button>
          ))}
        </div>

        {/* Download CSV Button */}
        <button
          onClick={downloadCSV}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Descargar CSV
        </button>
      </div>

      <table className="min-w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr>
            <th
              className="border px-4 py-2 cursor-pointer"
              onClick={() => handleSort('GROUPED_VALUE')}
            >
              {groupBy} {sortConfig?.key === 'GROUPED_VALUE' && (sortConfig.direction === 'asc' ? '🔼' : '🔽')}
            </th>
            <th
              className="border px-4 py-2 cursor-pointer"
              onClick={() => handleSort('STORE')}
            >
              Tienda {sortConfig?.key === 'STORE' && (sortConfig.direction === 'asc' ? '🔼' : '🔽')}
            </th>
            <th
              className="border px-4 py-2 cursor-pointer"
              onClick={() => handleSort('TOTAL_SEGMENT')}
            >
              Segmentación {sortConfig?.key === 'TOTAL_SEGMENT' && (sortConfig.direction === 'asc' ? '🔼' : '🔽')}
            </th>
            <th
              className="border px-4 py-2 cursor-pointer"
              onClick={() => handleSort('TOTAL_SALES')}
            >
              Ventas {sortConfig?.key === 'TOTAL_SALES' && (sortConfig.direction === 'asc' ? '🔼' : '🔽')}
            </th>
            <th
              className="border px-4 py-2 cursor-pointer"
              onClick={() => handleSort('TOTAL_STOCK')}
            >
              Stock Actual {sortConfig?.key === 'TOTAL_STOCK' && (sortConfig.direction === 'asc' ? '🔼' : '🔽')}
            </th>
            <th
              className="border px-4 py-2 cursor-pointer"
              onClick={() => handleSort('TOTAL_ORDERED')}
            >
              Ordenado {sortConfig?.key === 'TOTAL_ORDERED' && (sortConfig.direction === 'asc' ? '🔼' : '🔽')}
            </th>
            <th
              className="border px-4 py-2 cursor-pointer"
              onClick={() => handleSort('TOTAL_REPLENISHMENT')}
            >
              Reposición {sortConfig?.key === 'TOTAL_REPLENISHMENT' && (sortConfig.direction === 'asc' ? '🔼' : '🔽')}
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedLines.map((line, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="border px-4 py-2">{line.GROUPED_VALUE}</td>
              <td className="border px-4 py-2">{line.STORE}</td>
              <td className="border px-4 py-2">{line.TOTAL_SEGMENT}</td>
              <td className="border px-4 py-2">{line.TOTAL_SALES}</td>
              <td className="border px-4 py-2">{line.TOTAL_STOCK}</td>
              <td className="border px-4 py-2">{line.TOTAL_ORDERED}</td>
              <td className="border px-4 py-2">{line.TOTAL_REPLENISHMENT}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-5 flex w-full justify-center">
        <Pagination
          totalPages={Math.ceil(lines.length / itemsPerPage)}
          currentPage={currentPage}
          setPage={setCurrentPage}
        />
      </div>
    </div>
  );
}
