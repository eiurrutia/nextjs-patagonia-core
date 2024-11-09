'use client';
import { useEffect, useState } from 'react';
import { StockSegment } from '@/app/lib/definitions';
import { CardSkeleton } from '../skeletons';
import Pagination from '@/app/ui/pagination';

interface SegmentationTableProps {
  query: string;
  currentPage: number;
  setPage: (page: number) => void;
}

export default function SegmentationTable({ query, currentPage, setPage }: SegmentationTableProps) {
  const [segments, setSegments] = useState<StockSegment[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
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

    loadSegments();
    fetchTotalPages();
  }, [query, currentPage]);

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
          {segments.map((segment, index) => (
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
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} currentPage={currentPage} setPage={setPage} />
      </div>
    </div>
  );
}
