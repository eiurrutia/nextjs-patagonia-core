'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { CardSkeleton } from '@/app/ui/skeletons';
import Pagination from '@/app/ui/pagination';

export default function OperationsExportTable() {
  const params = useParams() as { id?: string };
  const id = params?.id;

  const [exportData, setExportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    null
  );

  useEffect(() => {
    async function fetchExportData() {
      if (!id) return;

      try {
        const response = await fetch(`/api/stock-planning/operation-replenishment?id=${id}`);
        const data = await response.json();
        setExportData(data);
      } catch (error) {
        console.error('Error fetching export data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchExportData();
  }, [id]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return exportData;
    return [...exportData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === undefined || bValue === undefined) return 0;
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [exportData, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  if (loading) return <CardSkeleton />;

  if (exportData.length === 0) {
    return <p className="text-center text-gray-600">No hay datos para exportar.</p>;
  }

  return (
    <div className="mt-6">
      <table className="min-w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr>
            {Object.keys(exportData[0]).map((key) => (
              <th
                key={key}
                className="border px-4 py-2 bg-gray-100 text-gray-700 font-semibold text-left cursor-pointer"
                onClick={() => handleSort(key)}
              >
                {key}
                {sortConfig?.key === key && (
                  <span>{sortConfig.direction === 'asc' ? ' 🔼' : ' 🔽'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {Object.values(row).map((value, idx) => (
                <td key={idx} className="border px-4 py-2 text-gray-800">
                  {value !== null && value !== undefined ? String(value) : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="mt-5 flex w-full justify-center">
        <Pagination
          totalPages={Math.ceil(sortedData.length / itemsPerPage)}
          currentPage={currentPage}
          setPage={setCurrentPage}
        />
      </div>
    </div>
  );
}