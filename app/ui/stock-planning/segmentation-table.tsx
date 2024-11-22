'use client';
import React, { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import { StockSegment } from '@/app/lib/definitions';
import { CardSkeleton } from '../skeletons';
import Pagination from '@/app/ui/pagination';

interface SegmentationTableProps {
  query: string;
  currentPage: number;
  setPage: (page: number) => void;
  selectedDeliveryOptions?: string[];
  showDeliveryFilters?: boolean;
  editedSegments: StockSegment[]; // Accept editedSegments as a prop
  setEditedSegments: Dispatch<SetStateAction<StockSegment[]>>;
}

export default function SegmentationTable({
  query,
  currentPage,
  setPage,
  selectedDeliveryOptions = [],
  editedSegments,
  setEditedSegments,
}: SegmentationTableProps) {
  const [segments, setSegments] = useState<StockSegment[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    async function loadSegments() {
      setLoading(true);
      try {
        const filterParam = selectedDeliveryOptions.length
          ? `&selectedDeliveryOptions=${encodeURIComponent(
              JSON.stringify(selectedDeliveryOptions)
            )}`
          : '';

        const response = await fetch(
          `/api/stock-planning/stock-segments?query=${encodeURIComponent(
            query
          )}&currentPage=${currentPage}${filterParam}`
        );
        const data: StockSegment[] = await response.json();

        // Merge loaded segments with edited ones
        const mergedData = data.map((segment) => {
          const editedSegment = editedSegments.find((item) => item.SKU === segment.SKU);
          return editedSegment ? { ...segment, ...editedSegment } : segment;
        });

        if (data.length > 0) {
          const keys = Object.keys(data[0]);
          const sortedColumns = [
            'SKU',
            'DELIVERY',
            ...keys.filter((key) => key !== 'SKU' && key !== 'DELIVERY'),
          ];
          setColumns(sortedColumns);
        }
        setSegments(mergedData);
      } catch (error) {
        console.error('Error loading segments:', error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchTotalPages() {
      try {
        const filterParam = selectedDeliveryOptions.length
          ? `&selectedDeliveryOptions=${encodeURIComponent(
              JSON.stringify(selectedDeliveryOptions)
            )}`
          : '';

        const response = await fetch(
          `/api/stock-planning/stock-segments-count?query=${encodeURIComponent(query)}${filterParam}`
        );
        const { totalCount } = await response.json();
        setTotalPages(Math.ceil(totalCount / limit));
      } catch (error) {
        console.error('Error fetching total pages:', error);
      }
    }

    fetchTotalPages();
    loadSegments();
  }, [query, currentPage, JSON.stringify(selectedDeliveryOptions)]);

  const handleEditCell = (rowIndex: number, column: string, value: string) => {
    const updatedSegments = segments.map((segment, index) =>
      index === rowIndex
        ? { ...segment, [column]: isNaN(Number(value)) ? value : Number(value) }
        : segment
    );

    setSegments(updatedSegments);

    // Persist changes in editedSegments
    setEditedSegments((prev: StockSegment[]) => {
      const newEditedSegments = [...prev]; // Create a new array to avoid mutating state directly
      const existingIndex = newEditedSegments.findIndex(
        (item) => item.SKU === updatedSegments[rowIndex].SKU
      );
      if (existingIndex >= 0) {
        newEditedSegments[existingIndex] = updatedSegments[rowIndex];
      } else {
        newEditedSegments.push(updatedSegments[rowIndex]);
      }
      return newEditedSegments;
    });
  };

  if (loading) return <CardSkeleton />;

  return (
    <div className="w-full overflow-auto mt-4">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setIsEditMode((prev) => !prev)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          {isEditMode ? 'Guardar' : 'Editar'}
        </button>
      </div>
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="border px-4 py-2 bg-gray-100 text-gray-700 font-semibold text-left"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {segments.map((segment, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td key={column} className="border px-4 py-2 text-gray-800">
                  {isEditMode && column !== 'SKU' && column !== 'DELIVERY' ? (
                    <input
                      type="number"
                      value={segment[column as keyof StockSegment] || 0}
                      onChange={(e) => handleEditCell(index, column, e.target.value)}
                      className="w-full border rounded px-2 py-1"
                    />
                  ) : (
                    segment[column as keyof StockSegment]
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} currentPage={currentPage} setPage={setPage} />
      </div>
    </div>
  );
}
