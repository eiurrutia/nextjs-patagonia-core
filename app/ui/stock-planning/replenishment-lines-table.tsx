'use client';
import React, { useEffect, useState } from 'react';
import { ReplenishmentLine } from '@/app/lib/definitions';
import { useParams } from 'next/navigation';
import { CardSkeleton } from '@/app/ui/skeletons';

export default function ReplenishmentLinesTable() {
  const params = useParams() as { id?: string }; 
  const id = params?.id;
  const [lines, setLines] = useState<ReplenishmentLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReplenishmentLines() {
      if (!id) return;
      try {
        const response = await fetch(`/api/stock-planning/replenishment-lines?id=${id}`);
        const data = await response.json();
        setLines(data);
      } catch (error) {
        console.error('Error fetching replenishment lines:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReplenishmentLines();
  }, [id]);

  if (loading) return <CardSkeleton />;
  if (!lines.length) return <p className="text-center text-gray-600">No hay líneas de reposición para esta ID.</p>;

  return (
    <table className="min-w-full border-collapse border border-gray-300 text-sm">
      <thead>
        <tr>
          <th className="border px-4 py-2">SKU</th>
          <th className="border px-4 py-2">Tienda</th>
          <th className="border px-4 py-2">Segmentación</th>
          <th className="border px-4 py-2">Ventas</th>
          <th className="border px-4 py-2">Stock Actual</th>
          <th className="border px-4 py-2">Ordenado</th>
          <th className="border px-4 py-2">Reposición</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line, index) => (
          <tr key={index} className="hover:bg-gray-50">
            <td className="border px-4 py-2">{line.SKU}</td>
            <td className="border px-4 py-2">{line.STORE}</td>
            <td className="border px-4 py-2">{line.SEGMENT}</td>
            <td className="border px-4 py-2">{line.SALES}</td>
            <td className="border px-4 py-2">{line.ACTUAL_STOCK}</td>
            <td className="border px-4 py-2">{line.ORDERED_QTY}</td>
            <td className="border px-4 py-2">{line.REPLENISHMENT}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
