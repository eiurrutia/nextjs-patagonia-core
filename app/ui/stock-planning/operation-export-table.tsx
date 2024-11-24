'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CardSkeleton } from '@/app/ui/skeletons';

export default function OperationsExportTable() {
  const params = useParams() as { id?: string };
  const id = params?.id;

  const [exportData, setExportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <CardSkeleton />;

  if (exportData.length === 0) {
    return <p className="text-center text-gray-600">No hay datos para exportar.</p>;
  }

  return (
    <div className="mt-6">
      <table className="min-w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr>
            <th className="border px-4 py-2">LINENUMBER</th>
            <th className="border px-4 py-2">ITEMNUMBER</th>
            <th className="border px-4 py-2">ORDEREDINVENTORYSTATUSID</th>
            <th className="border px-4 py-2">PRODUCTCOLORID</th>
            <th className="border px-4 py-2">PRODUCTCONFIGURATIONID</th>
            <th className="border px-4 py-2">PRODUCTSIZEID</th>
            <th className="border px-4 py-2">PRODUCTSTYLEID</th>
            <th className="border px-4 py-2">SHIPPINGWAREHOUSEID</th>
            <th className="border px-4 py-2">SHIPPINGWAREHOUSELOCATIONID</th>
            <th className="border px-4 py-2">TRANSFERQUANTITY</th>
            <th className="border px-4 py-2">TIENDA</th>
            <th className="border px-4 py-2">SKU</th>
            <th className="border px-4 py-2">TEAM</th>
            <th className="border px-4 py-2">CATEGORY</th>
            <th className="border px-4 py-2">PRODUCTNAME</th>
          </tr>
        </thead>
        <tbody>
          {exportData.map((row, index) => (
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
    </div>
  );
}
