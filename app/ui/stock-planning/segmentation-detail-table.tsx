'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { StockSegment } from '@/app/lib/definitions';
import { useParams } from 'next/navigation';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { CardSkeleton } from '@/app/ui/skeletons';
import Pagination from '@/app/ui/pagination';

export default function SegmentationDetailTable() {
  const params = useParams() as { id?: string };
  const id = params?.id;
  const [segmentation, setSegmentation] = useState<StockSegment[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    async function fetchSegmentation() {
      if (!id) return;
      try {
        const response = await fetch(`/api/stock-planning/segmentation-detail?id=${id}`);
        const data = await response.json();
        setSegmentation(data);
        console.log('Segmentation detail:', data);
      } catch (error) {
        console.error('Error fetching segmentation detail:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSegmentation();
  }, [id]);

  const columns = useMemo(() => {
    if (segmentation.length === 0) return [];
    const allKeys = Object.keys(segmentation[0]);
  
    const storeKeys = allKeys.filter(
      (key) => !['SKU', 'DELIVERY', 'SNOWFLAKE_CREATED_AT'].includes(key)
    );
  
    return ['SKU', 'DELIVERY', ...storeKeys, 'SNOWFLAKE_CREATED_AT'];
  }, [segmentation]);
  

  const sortedSegmentation = useMemo(() => {
    if (!sortConfig) return segmentation;
    const sorted = [...segmentation];
    sorted.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof StockSegment];
      const bValue = b[sortConfig.key as keyof StockSegment];

      if (aValue === undefined || bValue === undefined) return 0;
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [segmentation, sortConfig]);

  const paginatedSegmentation = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedSegmentation.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedSegmentation, currentPage]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  if (loading) return <CardSkeleton />;

  return (
    <div>
      <div
        className="flex items-center cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h2 className="text-2xl font-bold">Detalle de Segmentación</h2>
        {isCollapsed ? (
          <ChevronRightIcon className="h-6 w-6 text-gray-600 ml-2" />
        ) : (
          <ChevronDownIcon className="h-6 w-6 text-gray-600 ml-2" />
        )}
      </div>

      {!isCollapsed && (
        <div className="mt-4">
          <table className="min-w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    className="border px-4 py-2 bg-gray-100 text-gray-700 font-semibold text-left cursor-pointer"
                    onClick={() => handleSort(column)}
                  >
                    {column}
                    {sortConfig?.key === column && (
                      <span>{sortConfig.direction === 'asc' ? ' 🔼' : ' 🔽'}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedSegmentation.map((segment, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td key={column} className="border px-4 py-2 text-gray-800">
                      {segment[column as keyof StockSegment] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="mt-5 flex w-full justify-center">
            <Pagination
              totalPages={Math.ceil(sortedSegmentation.length / itemsPerPage)}
              currentPage={currentPage}
              setPage={setCurrentPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
