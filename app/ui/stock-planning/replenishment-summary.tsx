'use client';
import React, { useEffect, useState } from 'react';
import { ReplenishmentRecord } from '@/app/lib/definitions';
import { useParams } from 'next/navigation';
import { formatDate } from '@/app/utils/dateUtils';
import { CardSkeleton } from '@/app/ui/skeletons';
import {
  ClipboardDocumentListIcon,
  CubeIcon,
  ChartPieIcon,
  TruckIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

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
    <div className="bg-white border border-gray-300 rounded-lg p-6 shadow">
      <h2 className="text-lg font-bold mb-4 text-gray-700">Resumen de Reposición</h2>
      <div className="grid grid-cols-3 gap-4">
        {/* REP ID */}
        <div
          className="flex items-center space-x-2"
          title="Identificador único de la reposición"
        >
          <ClipboardDocumentListIcon className="h-6 w-6 text-gray-600" />
          <p className="text-gray-700 font-medium">{replenishment.ID}</p>
        </div>

        {/* Total Units */}
        <div
          className="flex items-center space-x-2"
          title="Total de unidades en esta reposición"
        >
          <CubeIcon className="h-6 w-6 text-gray-600" />
          <p className="text-gray-700 font-medium">Total U: {replenishment.TOTAL_REPLENISHMENT}</p>
        </div>

        {/* Breaken Units */}
        <div
          className="flex items-center space-x-2"
          title="Cantidad total de unidades en quiebre"
        >
          <ChartPieIcon className="h-6 w-6 text-gray-600" />
          <p className="text-gray-700 font-medium">Quiebres: {replenishment.TOTAL_BREAK_QTY}</p>
        </div>

        {/* Deliveries */}
        <div
          className="flex items-center space-x-2"
          title="Opciones de entrega seleccionadas para esta reposición"
        >
          <TruckIcon className="h-6 w-6 text-gray-600" />
          <p className="text-gray-700 font-medium">{replenishment.SELECTED_DELIVERIES}</p>
        </div>

        {/* Stores */}
        <div
          className="flex items-center space-x-2"
          title="Lista de tiendas consideradas en esta reposición"
        >
          <BuildingStorefrontIcon className="h-6 w-6 text-gray-600" />
          <p className="text-gray-700 font-medium">{replenishment.STORES_CONSIDERED || 'N/A'}</p>
        </div>

        {/* Sales Range */}
        <div
          className="flex items-center space-x-2"
          title="Rango de fechas utilizado para calcular esta reposición"
        >
          <CalendarDaysIcon className="h-6 w-6 text-gray-600" />
          <p className="text-gray-700 font-medium">
            {formatDate(replenishment.START_DATE)} - {formatDate(replenishment.END_DATE)}
          </p>
        </div>

        {/* Created Date */}
        <div
          className="flex items-center space-x-2 col-span-3"
          title="Fecha y hora en que se creó esta reposición"
        >
          <ClockIcon className="h-6 w-6 text-gray-600" />
          <p className="text-gray-700 font-medium">
            Creado: {formatDate(replenishment.CREATED_AT, true)}
          </p>
        </div>
      </div>
    </div>
  );
}