'use client';
import { useEffect, useState } from 'react';
import { StockSegment } from '@/app/lib/definitions';
import { CardSkeleton } from '../skeletons';
import Pagination from '@/app/ui/pagination';

interface SegmentationTableProps {
  query: string;
  currentPage: number;
  setPage: (page: number) => void;
  showDeliveryFilters?: boolean; // Propiedad opcional para mostrar los filtros
}

export default function SegmentationTable({ query, currentPage, setPage, showDeliveryFilters = true }: SegmentationTableProps) {
  const [segments, setSegments] = useState<StockSegment[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [deliveryOptions, setDeliveryOptions] = useState<string[]>([]);
  const [selectedDeliveryOptions, setSelectedDeliveryOptions] = useState<string[]>([]);
  const limit = 10;

  useEffect(() => {
    async function loadSegments() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/stock-planning/stock-segments?query=${encodeURIComponent(query)}&currentPage=${currentPage}`
        );
        const data: StockSegment[] = await response.json();

        if (data.length > 0) {
          const keys = Object.keys(data[0]);
          const sortedColumns = [
            'SKU', 'DELIVERY',
            ...keys.filter((key) => (key !== 'SKU' && key !== 'DELIVERY'))
          ];
          setColumns(sortedColumns);

          const uniqueDeliveryOptions = Array.from(new Set(data.map(segment => segment.DELIVERY).filter(Boolean)));
          setDeliveryOptions(uniqueDeliveryOptions);

          setSelectedDeliveryOptions(uniqueDeliveryOptions);
        }

        setSegments(data);
      } catch (error) {
        console.error('Error loading segments:', error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchTotalPages() {
      try {
        const response = await fetch(`/api/stock-planning/stock-segments-count?query=${encodeURIComponent(query)}`);
        const { totalCount } = await response.json();
        setTotalPages(Math.ceil(totalCount / limit));
      } catch (error) {
        console.error('Error fetching total pages:', error);
      }
    }

    loadSegments();
    fetchTotalPages();
  }, [query, currentPage]);

  const filteredSegments = segments.filter(segment => selectedDeliveryOptions.includes(segment.DELIVERY));

  const handleDeliveryFilterChange = (delivery: string) => {
    setSelectedDeliveryOptions((prevSelected) =>
      prevSelected.includes(delivery)
        ? prevSelected.filter((option) => option !== delivery) // Quitar de los seleccionados
        : [...prevSelected, delivery] // Agregar a los seleccionados
    );
  };

  if (loading) return <CardSkeleton />;

  return (
    <div className="w-full overflow-auto mt-4">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} className="border px-4 py-2">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredSegments.map((segment, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column} className="border px-4 py-2">
                  {segment[column as keyof StockSegment]}
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

      {/* Filters by DELIVERY */}
      {showDeliveryFilters && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {deliveryOptions.map((delivery) => (
              <label key={delivery} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selectedDeliveryOptions.includes(delivery)}
                  onChange={() => handleDeliveryFilterChange(delivery)}
                  className="cursor-pointer"
                />
                {delivery}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
