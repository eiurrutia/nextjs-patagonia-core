'use client';
import React, { useEffect, useState } from 'react';
import { ReplenishmentRecord } from '@/app/lib/definitions';
import { useParams } from 'next/navigation';
import { formatDate } from '@/app/utils/dateUtils';
import { CardSkeleton } from '@/app/ui/skeletons';

export default function ReplenishmentSummary() {
  const params = useParams() as { id?: string };
  const id = params?.id;
  const [replenishment, setReplenishment] = useState<ReplenishmentRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReplenishment() {
      if (!id) return;
      try {
        const response = await fetch(`/api/stock-planning/replenishment-summary?id=${id}`);
        const data = await response.json();
        setReplenishment(data);
      } catch (error) {
        console.error('Error fetching replenishment summary:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReplenishment();
  }, [id]);

  if (loading) return <CardSkeleton />;
  if (!replenishment) return <p>No se encontró información para el ID: {id}</p>;

  return (
    <div className="bg-gray-100 p-4 rounded shadow">
      <p><strong>REP ID:</strong> {replenishment.ID}</p>
      <p><strong>Total Unidades:</strong> {replenishment.TOTAL_REPLENISHMENT}</p>
      <p><strong>Total Quiebres:</strong> {replenishment.TOTAL_BREAK_QTY}</p>
      <p><strong>Deliveries:</strong> {replenishment.SELECTED_DELIVERIES}</p>
      <p><strong>Tiendas:</strong> {replenishment.STORES_CONSIDERED || 'N/A'}</p>
      <p><strong>Rango de Venta:</strong> {formatDate(replenishment.START_DATE)} - {formatDate(replenishment.END_DATE)}</p>
      <p><strong>Creación:</strong> {formatDate(replenishment.CREATED_AT, true)}</p>
    </div>
  );
}
