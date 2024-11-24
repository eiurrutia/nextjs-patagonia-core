'use client';
import React, { useState, useEffect } from 'react';
import { StockSegment } from '@/app/lib/definitions';
import { useParams } from 'next/navigation';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { CardSkeleton } from '@/app/ui/skeletons';

export default function SegmentationDetailTable() {
  const params = useParams() as { id?: string };
  const id = params?.id;
  const [segmentation, setSegmentation] = useState<StockSegment[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSegmentation() {
      if (!id) return;
      try {
        const response = await fetch(`/api/stock-planning/segmentation-detail?id=${id}`);
        const data = await response.json();
        setSegmentation(data);
      } catch (error) {
        console.error('Error fetching segmentation detail:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSegmentation();
  }, [id]);

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
        <table className="min-w-full border-collapse border border-gray-300 text-sm mt-4">
          <thead>
            <tr>
              <th className="border px-4 py-2">SKU</th>
              <th className="border px-4 py-2">Entrega</th>
              <th className="border px-4 py-2">Tiendas</th>
              <th className="border px-4 py-2">Creación</th>
            </tr>
          </thead>
          <tbody>
            {segmentation.map((segment, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{segment.SKU}</td>
                <td className="border px-4 py-2">{segment.DELIVERY}</td>
                <td className="border px-4 py-2">{segment.STORES}</td>
                <td className="border px-4 py-2">{segment.SNOWFLAKE_CREATED_AT}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
