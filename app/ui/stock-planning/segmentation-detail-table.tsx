'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { CardSkeleton } from '@/app/ui/skeletons';
import Pagination from '@/app/ui/pagination';
import TableSearch from '@/app/ui/table-search';

export default function SegmentationDetailTable() {
  const params = useParams() as { id?: string };
  const id = params?.id;

  const [segmentation, setSegmentation] = useState<any[]>([]);
  const [filteredSegmentation, setFilteredSegmentation] = useState<any[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [groupBy, setGroupBy] = useState<'SKU' | 'CC' | 'TEAM' | 'CATEGORY'>('SKU');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    async function fetchSegmentation() {
      if (!id) return;
      setLoading(true);
      try {
        const response = await fetch(`/api/stock-planning/segmentation-detail?id=${id}&groupBy=${groupBy}`);
        const data = await response.json();
        setSegmentation(data);
        setFilteredSegmentation(data);
      } catch (error) {
        console.error('Error fetching segmentation detail:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSegmentation();
  }, [id, groupBy]);

  const handleSearch = (term: string) => {
    const lowercasedTerm = term.toLowerCase();
    const filtered = segmentation.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(lowercasedTerm)
      )
    );
    setFilteredSegmentation(filtered);
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredSegmentation;
    return [...filteredSegmentation].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredSegmentation, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage]);

  const downloadCSV = () => {
    if (!filteredSegmentation || filteredSegmentation.length === 0) return;

    const headers = Object.keys(filteredSegmentation[0])
      .filter((key) => !(groupBy === 'SKU' && key === 'GROUPED_VALUE'))
      .map((key) => (key === 'GROUPED_VALUE' ? groupBy : key))
      .join(',');

    const rows = filteredSegmentation.map((row) =>
      Object.keys(row)
        .filter((key) => !(groupBy === 'SKU' && key === 'GROUPED_VALUE'))
        .map((key) => `"${row[key] ?? ''}"`)
        .join(',')
    );

    const csvContent = `${headers}\n${rows.join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `segmentation_${groupBy}_${id}.csv`;
    link.click();

    URL.revokeObjectURL(url);
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
          <div className="mb-4">
            <TableSearch placeholder="Buscar en detalle de segmentación..." onSearch={handleSearch} />
          </div>
          <div className="flex justify-between items-center mb-4">
            {/* Group By Buttons */}
            <div className="flex gap-2">
              {['SKU', 'CC', 'TEAM', 'CATEGORY'].map((option) => (
                <button
                  key={option}
                  onClick={() => setGroupBy(option as 'SKU' | 'CC' | 'TEAM' | 'CATEGORY')}
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

          {/* Scrollable Table Container */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr>
                  {segmentation.length > 0 &&
                    Object.keys(segmentation[0])
                      .filter((key) => !(groupBy === 'SKU' && key === 'GROUPED_VALUE'))
                      .map((column) => (
                        <th
                          key={column}
                          className="border px-4 py-2 bg-gray-100 text-gray-700 font-semibold text-left cursor-pointer"
                          onClick={() => handleSort(column)}
                        >
                          {column === 'GROUPED_VALUE' ? groupBy : column}
                          {sortConfig?.key === column && (
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
                        {value !== null && value !== undefined ? String(value) : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-5 flex w-full justify-center">
            <Pagination
              totalPages={Math.ceil(filteredSegmentation.length / itemsPerPage)}
              currentPage={currentPage}
              setPage={setCurrentPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
