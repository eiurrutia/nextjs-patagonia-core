'use client';
import React, { useEffect, useState } from 'react';
import { ReplenishmentRecord } from '@/app/lib/definitions';
import Pagination from '../pagination';
import { CardSkeleton } from '../skeletons';
import { formatDate } from '@/app/utils/dateUtils'


export default function ReplenishmentsList() {
  const [replenishments, setReplenishments] = useState<ReplenishmentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function fetchReplenishments() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/stock-planning/replenishments?query=${encodeURIComponent(
            query
          )}&page=${currentPage}&limit=${itemsPerPage}`
        );
        const data = await response.json();
        setReplenishments(data.records);
        setTotalPages(Math.ceil(data.totalCount / itemsPerPage));
      } catch (error) {
        console.error('Error fetching replenishments:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReplenishments();
  }, [query, currentPage]);

  if (loading) return <CardSkeleton />;

  return (
    <div className="w-full overflow-auto mt-4">
      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search ID, Deliveries, Stores..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCurrentPage(1); // Reset to first page on new search
          }}
          className="border rounded p-2 w-full"
        />
      </div>

      {/* Replenishments Table */}
      <table className="min-w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr>
            <th className="border px-4 py-2">REP ID</th>
            <th className="border px-4 py-2">TOTAL U.</th>
            <th className="border px-4 py-2">TOTAL QUIEBRES</th>
            <th className="border px-4 py-2">DELIVERIES</th>
            <th className="border px-4 py-2 max-w-[300px] break-words">TIENDAS</th>
            <th className="border px-4 py-2">RANGO VENTA</th>
            <th className="border px-4 py-2">CREACIÓN</th>
          </tr>
        </thead>
        <tbody>
          {replenishments.map((item) => (
            <tr key={item.ID + item.CREATED_AT}>
              <td className="border px-4 py-2">{item.ID}</td>
              <td className="border px-4 py-2">{item.TOTAL_REPLENISHMENT}</td>
              <td className="border px-4 py-2">{item.TOTAL_BREAK_QTY}</td>
              <td className="border px-4 py-2">{item.SELECTED_DELIVERIES}</td>
              <td className="border px-4 py-2 max-w-[300px] break-words">{item.STORES_CONSIDERED || 'N/A'}</td>
              <td className="border px-4 py-2">{formatDate(item.START_DATE)} | {formatDate(item.END_DATE)}</td>
              <td className="border px-4 py-2">{formatDate(item.CREATED_AT, true, false)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="mt-5 flex w-full justify-center">
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          setPage={setCurrentPage}
        />
      </div>
    </div>
  );
}
