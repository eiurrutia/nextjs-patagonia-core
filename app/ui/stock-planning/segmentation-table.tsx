'use client';
import { useEffect, useState } from 'react';
import { StockSegment } from '@/app/lib/definitions';
import { CardSkeleton } from '../skeletons';
import Pagination from '@/app/ui/pagination';

interface SegmentationTableProps {
  query: string;
  currentPage: number;
  setPage: (page: number) => void;
  showDeliveryFilters?: boolean;
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

    async function fetchAllDeliveryOptions() {
      try {
        const response = await fetch('/api/stock-planning/stock-segments-delivery-options');
        const allDeliveryOptions = await response.json();
        setDeliveryOptions(allDeliveryOptions);
        setSelectedDeliveryOptions(allDeliveryOptions);
      } catch (error) {
        console.error('Error fetching all delivery options:', error);
      }
    }

    loadSegments();
    fetchTotalPages();
    fetchAllDeliveryOptions();
  }, [query, currentPage]);

  const filteredSegments = segments.filter(segment => selectedDeliveryOptions.includes(segment.DELIVERY));

  const handleDeliveryFilterChange = (delivery: string) => {
    setSelectedDeliveryOptions((prevSelected) =>
      prevSelected.includes(delivery)
        ? prevSelected.filter((option) => option !== delivery)
        : [...prevSelected, delivery]
    );
  };

  if (loading) return <CardSkeleton />;

  return (
    <div className="w-full overflow-auto mt-4">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} className="border px-4 py-2 bg-gray-100 text-gray-700 font-semibold text-left">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredSegments.map((segment, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td key={column} className="border px-4 py-2 text-gray-800">
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

      {/* DELIVERY filters */}
      {showDeliveryFilters && (
        <div className="mt-6">
          <h4 className="font-semibold mb-3">Filtrar por DELIVERY:</h4>
          <div className="flex flex-wrap gap-3">
            {deliveryOptions.map((delivery) => (
              <label key={delivery} className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg shadow cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedDeliveryOptions.includes(delivery)}
                  onChange={() => handleDeliveryFilterChange(delivery)}
                  className="cursor-pointer accent-blue-600"
                />
                <span className="text-gray-700">{delivery}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
