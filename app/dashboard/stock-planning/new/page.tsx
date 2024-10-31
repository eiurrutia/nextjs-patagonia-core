'use client';
import { useState } from 'react';
import SegmentationTable from '@/app/ui/stock-planning/segmentation-table';
import SalesTable from '@/app/ui/stock-planning/sales-table';
import StockTable from '@/app/ui/stock-planning/stock-table';
import Search from '@/app/ui/search';
import { lusitana } from '@/app/ui/fonts';
import { Suspense } from 'react';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';

export default function NewStockPlanning({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
  };
}) {
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 14);
    return date.toISOString().split('T')[0];
  });

  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Nuevo Stock Planning</h1>
      </div>

      <div className="mt-4 flex items-center gap-2 md:mt-8">
        <Search placeholder="Buscar SKU..." />
      </div>

      <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton />}>
        <h2 className={`${lusitana.className} text-2xl mt-8`}>Segmentación</h2>
        <SegmentationTable query={query} currentPage={currentPage} />
      </Suspense>

      <div className="mt-12 flex gap-4">
        <h2 className={`${lusitana.className} text-2xl`}>Ventas</h2>
        <div>
          <label>Fecha Inicio:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border p-2 rounded"
          />
        </div>

        <div>
          <label>Fecha Fin:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border p-2 rounded"
          />
        </div>
      </div>

      <div className="mt-8">
        <Suspense fallback={<InvoicesTableSkeleton />}>
          <SalesTable startDate={startDate} endDate={endDate} query={query} currentPage={currentPage} />
        </Suspense>
      </div>

      <div className="mt-8">
        <h2 className={`${lusitana.className} text-2xl mt-8`}>Stock</h2>
        <Suspense fallback={<InvoicesTableSkeleton />}>
          <StockTable query={query} currentPage={currentPage} />
        </Suspense>
      </div>
    </div>
  );
}
