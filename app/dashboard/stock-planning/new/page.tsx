'use client';
import { useState, useEffect, Suspense } from 'react';
import StorePriority from '@/app/ui/stock-planning/store-priority';
import SegmentationTable from '@/app/ui/stock-planning/segmentation-table';
import SalesTable from '@/app/ui/stock-planning/sales-table';
import CDStockTable from '@/app/ui/stock-planning/cd-stock-table';
import StoresStockTable from '@/app/ui/stock-planning/store-stock-table';
import Search from '@/app/ui/search';
import ReplenishmentTable from '@/app/ui/stock-planning/replenishment-table';
import { lusitana } from '@/app/ui/fonts';
import { InvoicesTableSkeleton, CardSkeleton } from '@/app/ui/skeletons';
import { StockSegment } from '@/app/lib/definitions';

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
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);
  const [startDate, setStartDate] = useState(() => oneWeekAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => today.toISOString().split('T')[0]);
  const [showReplenishment, setShowReplenishment] = useState(false);

  const [deliveryOptions, setDeliveryOptions] = useState<string[]>([]);
  const [selectedDeliveryOptions, setSelectedDeliveryOptions] = useState<string[]>([]);
  const [loadingSelectedDeliveryOptions, setLoadingSelectedDeliveryOptions] = useState(false);
  const [editedSegments, setEditedSegments] = useState<StockSegment[]>([]);
  const [editedSales, setEditedSales] = useState<any[]>([]);
  const [storePriority, setStorePriority] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoadingSelectedDeliveryOptions(true);
        // Fetch all delivery options
        const responseOptions = await fetch('/api/stock-planning/stock-segments-delivery-options');
        const options = await responseOptions.json();

        // Fetch configured deliveries
        const responseConfig = await fetch('/api/configs/configs');
        const configs = await responseConfig.json();
        const deliveriesConfig = configs.find(
          (config: any) => config.config_key === 'stock_planning_deliveries_set'
        );
        const configuredDeliveries = deliveriesConfig
          ? deliveriesConfig.config_value.split(',').map((item: string) => item.trim())
          : [];
        const filteredConfiguredDeliveries = configuredDeliveries.filter((delivery: string) =>
          options.includes(delivery)
        );

        setDeliveryOptions(options);
        setSelectedDeliveryOptions(
          filteredConfiguredDeliveries.length > 0 ? filteredConfiguredDeliveries : options
        );

        // Fetch store priority
        const priorityConfig = configs.find(
          (config: any) => config.config_key === 'stock_planning_store_priority'
        );
        const prioritizedStores = priorityConfig
          ? priorityConfig.config_value.split(', ').map((item: string) => item.trim())
          : [];
        setStorePriority(prioritizedStores);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingSelectedDeliveryOptions(false);
      }
    }
  
    fetchData();
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

  const handlePriorityChange = (newPriority: string[]) => {
    setStorePriority(newPriority);
  };

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Nuevo Stock Planning</h1>
      </div>

      <div className="mt-4 flex items-center gap-2 md:mt-8">
        <Search placeholder="Buscar SKU..." />
      </div>
        
      {/* Store Priority */}
      <div className="mt-6">
        <StorePriority stores={storePriority} onPriorityChange={handlePriorityChange}/>
      </div>

      {/* DELIVERY filters and Segmentation */}
      <div className="mt-6">
        {loadingSelectedDeliveryOptions ? (
          <CardSkeleton />
        ) : (
          <>
            <h2 className={`${lusitana.className} text-2xl mt-8`}>Segmentación</h2>
            {/* DELIVERY filters */}
            <div className="flex flex-wrap gap-3 mt-4">
              {deliveryOptions.map((delivery) => (
                <label
                  key={delivery}
                  className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg shadow cursor-pointer"
                >
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

            {/* Segmentation */}
            <Suspense fallback={<InvoicesTableSkeleton />}>
              <SegmentationTable
                query={query}
                currentPage={segmentationPage}
                setPage={setSegmentationPage}
                selectedDeliveryOptions={selectedDeliveryOptions}
                editedSegments={editedSegments}
                setEditedSegments={setEditedSegments}
                isEditable={true}
              />
            </Suspense>
          </>
        )}
      </div>

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
          <SalesTable
            startDate={startDate}
            endDate={endDate}
            query={query}
            currentPage={salesPage}
            setPage={setSalesPage}
            editedSales={editedSales}
            setEditedSales={setEditedSales}
          />
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
      {!showReplenishment && (
        <div className="w-full mt-4">
          <button
            onClick={handleGenerateReplenishment}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Generar Reposición
          </button>
        </div>
      )}

      {/* Replenishment Table */}
      {showReplenishment && (
        <div className="mt-16">
          {/* Divider */}
          <div className="flex items-center my-8">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-4 text-gray-500">O</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <h2 className={`${lusitana.className} text-2xl text-center mt-16`}>Resultado de Reposición</h2>
          <ReplenishmentTable
            startDate={startDate}
            endDate={endDate}
            selectedDeliveryOptions={selectedDeliveryOptions}
            editedSegments={editedSegments}
            editedSales={editedSales}
            storePriority={storePriority}
          />
        </div>
      )}
    </div>
  );
}
