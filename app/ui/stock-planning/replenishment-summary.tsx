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

  const erpUrl = process.env.NEXT_PUBLIC_ERP_URL;

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6 shadow">
      <h2 className="text-lg font-bold mb-4 text-gray-700">{replenishment.ID}</h2>
      <div className="grid grid-cols-3 gap-4">
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

        {/* Sales Range */}
        <div
          className="flex items-center space-x-2"
          title="Rango de fechas utilizado para calcular esta reposición"
        >
          <CalendarDaysIcon className="h-6 w-6 text-gray-600" />
          <p className="text-gray-700 font-medium">
            {formatDate(replenishment.START_DATE, false, false)} | {formatDate(replenishment.END_DATE, false, false)}
          </p>
        </div>

        {/* Created Date */}
        <div
          className="flex items-center space-x-2"
          title="Fecha y hora en que se creó esta reposición"
        >
          <ClockIcon className="h-6 w-6 text-gray-600" />
          <p className="text-gray-700 font-medium">
            Creado: {formatDate(replenishment.CREATED_AT, true)}
          </p>
        </div>
      </div>

      {/* Stores - Full Row */}
      <div className="flex items-center space-x-2 mt-4" title="Lista de tiendas consideradas en esta reposición">
        <BuildingStorefrontIcon className="h-6 w-6 text-gray-600" />
        <p className="text-gray-700 font-medium w-full">{replenishment.STORES_CONSIDERED || 'N/A'}</p>
      </div>

      {/* ERP_TRS_IDS - Full Row */}
      {replenishment.ERP_TRS_IDS && (
        <div className="flex items-center space-x-2 mt-4" title="Número de TR">
          <ClipboardDocumentListIcon className="h-6 w-6 text-gray-600" />
          <p className="text-gray-700 font-medium w-full">
            Número de TR: {replenishment.ERP_TRS_IDS}{' '}
            {erpUrl && (
              <a
                href={`${erpUrl}/?cmp=PAT&mi=InventTransferOrder`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline ml-2"
              >
                Ver en ERP
              </a>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
