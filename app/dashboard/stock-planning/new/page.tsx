'use client';
import { useState } from 'react';
import SegmentationTable from '@/app/ui/stock-planning/segmentation-table';
import SalesTable from '@/app/ui/stock-planning/sales-table';
import CDStockTable from '@/app/ui/stock-planning/cd-stock-table';
import StoresStockTable from '@/app/ui/stock-planning/store-stock-table';
import Search from '@/app/ui/search';
import { lusitana } from '@/app/ui/fonts';
import { Suspense } from 'react';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';

export default function NewStockPlanning({
  searchParams,
}: {
  searchParams?: {
    query?: string;
  };
}) {
  const query = searchParams?.query || '';
  const [segmentationPage, setSegmentationPage] = useState(1);
  const [salesPage, setSalesPage] = useState(1);
  const [cdStockPage, setCDStockPage] = useState(1);
  const [storesStockPage, setStoresStockPage] = useState(1);

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

      {/* Segmentación */}
      <Suspense key={query + segmentationPage} fallback={<InvoicesTableSkeleton />}>
        <h2 className={`${lusitana.className} text-2xl mt-8`}>Segmentación</h2>
        <SegmentationTable query={query} currentPage={segmentationPage} setPage={setSegmentationPage} />
      </Suspense>

      {/* Ventas */}
      <div className="mt-12 flex gap-4">
        <h2 className={`${lusitana.className} text-2xl`}>Ventas</h2>
        <div>
          <label className='mx-4'>Fecha Inicio:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border p-2 rounded"
          />
        </div>

        <div>
          <label className='mx-4'>Fecha Fin:</label>
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
          <SalesTable startDate={startDate} endDate={endDate} query={query} currentPage={salesPage} setPage={setSalesPage} />
        </Suspense>
      </div>

      {/* Stock CD */}
      <div className="mt-8">
        <h2 className={`${lusitana.className} text-2xl mt-8`}>Stock CD</h2>
        <Suspense fallback={<InvoicesTableSkeleton />}>
          <CDStockTable query={query} currentPage={cdStockPage} setPage={setCDStockPage} />
        </Suspense>
      </div>

      {/* Stock Tiendas */}
      <div className="mt-8">
        <h2 className={`${lusitana.className} text-2xl mt-8`}>Stock Tiendas</h2>
        <Suspense fallback={<InvoicesTableSkeleton />}>
          <StoresStockTable query={query} currentPage={storesStockPage} setPage={setStoresStockPage} />
        </Suspense>
      </div>
    </div>
  );
}
