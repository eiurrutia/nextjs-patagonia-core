'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { CardSkeleton } from '../skeletons';
import Pagination from '../pagination';
import { SalesData } from '@/app/lib/definitions';

interface SalesTableProps {
  startDate: string;
  endDate: string;
  query: string;
  currentPage: number;
  setPage: (page: number) => void;
  editedSales?: SalesData[];
  setEditedSales?: React.Dispatch<React.SetStateAction<SalesData[]>>;
}

export default function SalesTable({ startDate, endDate, query, currentPage, setPage, editedSales = [], setEditedSales }: SalesTableProps) {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [localEdits, setLocalEdits] = useState<SalesData[]>([]);
  const limit = 10;

  useEffect(() => {
    async function fetchSalesData() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/stock-planning/sales?startDate=${startDate}&endDate=${endDate}&query=${encodeURIComponent(
            query
          )}&page=${currentPage}&sortKey=${sortConfig?.key || ''}&sortDirection=${sortConfig?.direction || ''}`
        );
        const data: SalesData[] = await response.json();
        setSalesData(data);
      } catch (error) {
        console.error('Error fetching sales data:', error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchTotalPages() {
      try {
        const response = await fetch(
          `/api/stock-planning/sales-count?startDate=${startDate}&endDate=${endDate}&query=${encodeURIComponent(query)}`
        );
        const { totalCount } = await response.json();
        setTotalPages(Math.ceil(totalCount / limit));
      } catch (error) {
        console.error('Error fetching total pages:', error);
      }
    }

    fetchSalesData();
    fetchTotalPages();
  }, [startDate, endDate, query, currentPage, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Saving
      if (setEditedSales) {
        setEditedSales(localEdits);
      }
      setIsEditing(false);
    } else {
      // Starting edit
      setLocalEdits(editedSales);
      setIsEditing(true);
    }
  };

  const handleInputChange = (sku: string, field: string, value: string) => {
    const numValue = Number(value);
    if (isNaN(numValue)) return;

    setLocalEdits((prev) => {
      const existingIndex = prev.findIndex((item) => item.SKU === sku);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], [field]: numValue };
        return updated;
      } else {
        const original = salesData.find((s) => s.SKU === sku);
        if (!original) return prev;
        return [...prev, { ...original, [field]: numValue }];
      }
    });
  };

  const currentEdits = isEditing ? localEdits : editedSales;

  const mergedData = useMemo(() => {
    return salesData.map((item) => {
      const edited = currentEdits.find((e) => e.SKU === item.SKU);
      return edited ? { ...item, ...edited } : item;
    });
  }, [salesData, currentEdits]);

  const sortedData = useMemo(() => {
    let sortableData = [...mergedData];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof SalesData];
        const bValue = b[sortConfig.key as keyof SalesData];

        const aValueNum = Number(aValue);
        const bValueNum = Number(bValue);

        if (!isNaN(aValueNum) && !isNaN(bValueNum)) {
          // Numeric comparison
          return sortConfig.direction === 'asc' ? aValueNum - bValueNum : bValueNum - aValueNum;
        } else {
          // String comparison
          const aStr = String(aValue);
          const bStr = String(bValue);
          if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        }
      });
    }
    return sortableData;
  }, [mergedData, sortConfig]);

  if (loading) return <CardSkeleton />;

  return (
    <div className="w-full overflow-auto mt-4">
      <div className="flex justify-end mb-2">
        <button
          onClick={handleEditToggle}
          className={`px-4 py-2 rounded text-white ${
            isEditing ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isEditing ? 'Guardar' : 'Editar'}
        </button>
      </div>
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            {[
              'SKU',
              'ECOM',
              'COYHAIQUE',
              'LASCONDES',
              'MALLSPORT',
              'COSTANERA',
              'CONCEPCION',
              'PTOVARAS',
              'LADEHESA',
              'PUCON',
              'TEMUCO',
              'OSORNO',
              'ALERCE',
              'BNAVENTURA',
              'ADMIN',
            ].map((column) => (
              <th
                key={column}
                className="border px-4 py-2 cursor-pointer"
                onClick={() => handleSort(column)}
              >
                {column} {sortConfig?.key === column && (sortConfig.direction === 'asc' ? '🔼' : '🔽')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((sale) => (
            <tr key={sale.SKU}>
              <td className="border px-4 py-2">{sale.SKU}</td>
              {[
                'ECOM',
                'COYHAIQUE',
                'LASCONDES',
                'MALLSPORT',
                'COSTANERA',
                'CONCEPCION',
                'PTOVARAS',
                'LADEHESA',
                'PUCON',
                'TEMUCO',
                'OSORNO',
                'ALERCE',
                'BNAVENTURA',
                'ADMIN',
              ].map((store) => (
                <td key={store} className="border px-4 py-2">
                  {isEditing ? (
                    <input
                      type="number"
                      value={sale[store]}
                      onChange={(e) => handleInputChange(sale.SKU, store, e.target.value)}
                      className="w-20 border rounded px-1"
                    />
                  ) : (
                    sale[store]
                  )}
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
