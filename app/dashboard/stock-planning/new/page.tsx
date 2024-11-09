'use client';
import { useState, useEffect } from 'react';
import SegmentationTable from '@/app/ui/stock-planning/segmentation-table';
import SalesTable from '@/app/ui/stock-planning/sales-table';
import CDStockTable from '@/app/ui/stock-planning/cd-stock-table';
import StoresStockTable from '@/app/ui/stock-planning/store-stock-table';
import Search from '@/app/ui/search';
import ReplenishmentTable from '@/app/ui/stock-planning/replenishment-table';
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
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showReplenishment, setShowReplenishment] = useState(false);

  const [deliveryOptions, setDeliveryOptions] = useState<string[]>([]);
  const [selectedDeliveryOptions, setSelectedDeliveryOptions] = useState<string[]>([]);

  useEffect(() => {
    async function fetchDeliveryOptions() {
      const response = await fetch('/api/stock-planning/stock-segments-delivery-options');
      const options = await response.json();
      setDeliveryOptions(options);
      setSelectedDeliveryOptions(options);
    }
    fetchDeliveryOptions();
  }, []);

  const handleDeliveryFilterChange = (delivery: string) => {
    setSelectedDeliveryOptions((prevSelected) =>
      prevSelected.includes(delivery)
        ? prevSelected.filter((option) => option !== delivery)
        : [...prevSelected, delivery]
    );
  };

  const handleGenerateReplenishment = () => {
    setShowReplenishment(true);
  };

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Nuevo Stock Planning</h1>
      </div>

      <div className="mt-4 flex items-center gap-2 md:mt-8">
        <Search placeholder="Buscar SKU..." />
      </div>

      {/* DELIVERY filters */}
      <div className="mt-6">
        <div className="flex flex-wrap gap-3">
          {deliveryOptions.map((delivery) => (
            <label key={delivery} className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg shadow cursor-pointer">
              <input
                type="checkbox"
                checked={selectedDeliveryOptions.includes(delivery)}
                onChange={() => handleDeliveryFilterChange(delivery)}
                className="cursor-pointer accent-blue-600"
              />
              <span className="text-gray-700">{delivery}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Segmentation */}
      <Suspense key={query + segmentationPage} fallback={<InvoicesTableSkeleton />}>
        <h2 className={`${lusitana.className} text-2xl mt-8`}>Segmentación</h2>
        <SegmentationTable
          query={query}
          currentPage={segmentationPage}
          setPage={setSegmentationPage}
          selectedDeliveryOptions={selectedDeliveryOptions}
        />
      </Suspense>

      {/* Sales */}
      <div className="mt-12 flex gap-4">
        <h2 className={`${lusitana.className} text-2xl`}>Ventas</h2>
        <div>
          <label className="mx-4">Fecha Inicio:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border p-2 rounded"
          />
        </div>
        <div>
          <label className="mx-4">Fecha Fin:</label>
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

      {/* Stores Stock */}
      <div className="mt-8">
        <h2 className={`${lusitana.className} text-2xl mt-8`}>Stock Tiendas</h2>
        <Suspense fallback={<InvoicesTableSkeleton />}>
          <StoresStockTable query={query} currentPage={storesStockPage} setPage={setStoresStockPage} />
        </Suspense>
      </div>

      {/* Generate Replenishment button */}
      <div className="w-full mt-4">
        <button
          onClick={handleGenerateReplenishment}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Generar Reposición
        </button>
      </div>

      {/* Replenishment Table */}
      {showReplenishment && (
        <div className="mt-8">
          <h2 className={`${lusitana.className} text-2xl mt-8`}>Resultado de Reposición</h2>
          <ReplenishmentTable startDate={startDate} endDate={endDate} />
        </div>
      )}
    </div>
  );
}
