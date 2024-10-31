'use client';
import { useEffect, useState } from 'react';
import { StockSegment } from '@/app/lib/definitions';
import { CardSkeleton } from '../skeletons';

interface StockTableProps {
  query: string;
  currentPage: number;
}

export default function SegmentationTable({ query, currentPage }: StockTableProps) {
  const [segments, setSegments] = useState<StockSegment[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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
          const sortedColumns = ['SKU', ...keys.filter((key) => key !== 'SKU')];
          setColumns(sortedColumns);
        }

        setSegments(data);
      } catch (error) {
        console.error('Error loading segments:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSegments();
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
    </div>
  );
}
