'use client';
import { useEffect, useState, useMemo } from 'react';
import { CardSkeleton } from '../skeletons';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { ReplenishmentData, BreakData, StockSegment } from '@/app/lib/definitions';
import { getISOWeekNumber } from '@/app/utils/dateUtils';
import { toZonedTime } from 'date-fns-tz';

export default function ReplenishmentTable({
    startDate, 
    endDate,
    selectedDeliveryOptions
  }: {
    startDate: string;
    endDate: string
    selectedDeliveryOptions: string[];
  }) {
  const [replenishmentData, setReplenishmentData] = useState<ReplenishmentData[]>([]);
  const [breakData, setBreakData] = useState<BreakData[]>([]);
  const [segmentationData, setSegmentationData] = useState<StockSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof ReplenishmentData; direction: 'asc' | 'desc' } | null>(null);
  const [isSkuBreakExpanded, setIsSkuBreakExpanded] = useState(false);
  const [expandedStores, setExpandedStores] = useState<Record<string, boolean>>({});
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [saveDeliveriesSelected, setSaveDeliveriesSelected] = useState(true);

  useEffect(() => {
    async function fetchReplenishmentData() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/stock-planning/replenishment?startDate=${startDate}&endDate=${endDate}&selectedDeliveryOptions=${encodeURIComponent(JSON.stringify(selectedDeliveryOptions))}`
        );
        const data = await response.json();
        setReplenishmentData(data.replenishmentTable);
        setBreakData(data.breakData);
        setSegmentationData(data.stockSegments);
      } catch (error) {
        console.error('Error fetching replenishment data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReplenishmentData();
  }, [startDate, endDate, selectedDeliveryOptions]);

  const summary = useMemo(() => {
    const totalReplenishment = replenishmentData.reduce((sum, item) => sum + (item.REPLENISHMENT || 0), 0);
    const totalSales = replenishmentData.reduce((sum, item) => sum + (item.SALES || 0), 0);
    const totalInOrdered = replenishmentData.reduce((sum, item) => sum + (item.ORDERED_QTY || 0), 0);

    const replenishmentByStore = Object.entries(
      replenishmentData.reduce((acc, item) => {
        if (item.REPLENISHMENT > 0) {
          acc[item.STORE] = (acc[item.STORE] || 0) + item.REPLENISHMENT;
        }
        return acc;
      }, {} as Record<string, number>)
    ).sort(([a], [b]) => a.localeCompare(b));

    const totalBreakQty = breakData.reduce((sum, item) => sum + item.BREAK_QTY, 0);

    const breakByStore = Object.entries(
      breakData.reduce((acc, item) => {
        acc[item.STORE] = (acc[item.STORE] || 0) + item.BREAK_QTY;
        return acc;
      }, {} as Record<string, number>)
    ).sort(([a], [b]) => a.localeCompare(b));

    const breakByStoreSku = Object.entries(
      breakData.reduce((acc, item) => {
        if (!acc[item.STORE]) acc[item.STORE] = {};
        acc[item.STORE][item.SKU] = (acc[item.STORE][item.SKU] || 0) + item.BREAK_QTY;
        return acc;
      }, {} as Record<string, Record<string, number>>)
    ).sort(([a], [b]) => a.localeCompare(b));

    return { totalReplenishment, totalSales, replenishmentByStore, totalInOrdered, totalBreakQty, breakByStore, breakByStoreSku };
  }, [replenishmentData, breakData]);

  const filteredData = useMemo(() => {
    let data = replenishmentData;
    if (query) {
      data = data.filter(item =>
            item.SKU.toUpperCase().includes(query.toUpperCase()) ||
            item.STORE.toUpperCase().includes(query.toUpperCase())
      );
    }

    if (sortConfig) {
      data = [...data].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [query, replenishmentData, sortConfig]);

  const handleSort = (key: keyof ReplenishmentData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleStoreExpansion = (store: string) => {
    setExpandedStores(prev => ({
      ...prev,
      [store]: !prev[store]
    }));
  };

  const handleConfirmReplenishment = () => {
    setIsConfirmModalOpen(true);
  };

  const handleSaveReplenishmentRecord = async () => {
    const TIME_ZONE = 'America/Santiago';
    const today = toZonedTime(new Date(), TIME_ZONE);
    const weekNumber = getISOWeekNumber(today);
    const formattedDate = today.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const replenishmentID = `REP-W${weekNumber}_${formattedDate}`;
    const segmentationID = `SEG-W${weekNumber}_${formattedDate}`;

    const record = {
      ID: replenishmentID,
      totalReplenishment: summary.totalReplenishment,
      totalBreakQty: summary.totalBreakQty,
      selectedDeliveries: selectedDeliveryOptions.join(', '),
      startDate,
      endDate,
      replenishmentData
    };
  
    try {
      console.log('Saving replenishment record:', record);
      
      // Save selected deliveries if the option is checked
      if (saveDeliveriesSelected) {
        await fetch('/api/configs/configs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            config_key: 'stock_planning_deliveries_set',
            config_name: 'Deliveries',
            config_value: selectedDeliveryOptions.join(', '),
            description: 'Deliveries configuration for stock planning',
          }),
        });
      }

      // Save segmentaion history
      await fetch('/api/stock-planning/save-segmentation-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stockSegments: segmentationData,
          segID: segmentationID
        }),
      });

      // Save replenishment record
      const response = await fetch('/api/stock-planning/save-replenishment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
      });
  
      if (!response.ok) {
        throw new Error('Error al guardar el registro de reposición');
      }
      alert('Reposición confirmada exitosamente');
    } catch (error) {
      console.error('Error al guardar la reposición:', error);
      alert('Hubo un error al confirmar la reposición');
    }
  };
  

  return (
    <div>
      {loading ? (
        <CardSkeleton />
      ) : (
        <>
        <div className="my-4">
          <input
            type="text"
            placeholder="Buscar SKU, Tienda..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border rounded p-2 w-full"
          />
        </div>
        {/* Table */}
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('SKU')}>SKU</th>
              <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('STORE')}>Tienda</th>
              <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('SEGMENT')}>Segmentación</th>
              <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('SALES')}>Venta</th>
              <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('ACTUAL_STOCK')}>Stock Actual</th>
              <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('ORDERED_QTY')}>Ordenado</th>
              <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('REPLENISHMENT')}>Reposición</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.slice(0, 20).map((item, index) => (
                <tr key={`${item.SKU}-${item.STORE || index}`}>
                    <td className="border px-4 py-2">{item.SKU}</td>
                    <td className="border px-4 py-2">{item.STORE}</td>
                    <td className="border px-4 py-2">{item.SEGMENT}</td>
                    <td className="border px-4 py-2">{item.SALES}</td>
                    <td className="border px-4 py-2">{item.ACTUAL_STOCK}</td>
                    <td className="border px-4 py-2">{item.ORDERED_QTY}</td>
                    <td className="border px-4 py-2">{item.REPLENISHMENT}</td>
                </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Card */}
        <div className="p-6 my-6 rounded-lg shadow-md">
          <h3 className="text-2xl font-bold mb-4 text-center">Resumen de Reposición</h3>
          <div className="flex justify-around text-center">
            <div className="flex flex-col items-center">
              <p className="text-4xl font-bold text-blue-600">{summary.totalReplenishment}</p>
              <p className="text-sm text-gray-600">Total de Unidades a Reponer</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-4xl font-bold text-yellow-600">{summary.totalInOrdered}</p>
              <p className="text-sm text-gray-600">Total de Unidades en Reposición</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-4xl font-bold">{summary.totalSales}</p>
              <p className="text-sm text-gray-600">Total de Unidades Vendidas (Periodo)</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-4xl font-bold text-red-600">{summary.totalBreakQty}</p>
              <p className="text-sm text-red-600">Total de Unidades en Quiebre</p>
            </div>
          </div>

          {/* Replenishment and Stockout by Store*/}
          <div className="flex justify-between mt-20">
            <div className="w-1/2 pr-4">
              <h4 className="font-semibold">Reposición por Ubicación:</h4>
              <ul className="ml-4 list-disc">
                {summary.replenishmentByStore.map(([store, replenishment]) => (
                  <li key={store} className="text-gray-700 my-4">{store}: {replenishment} unidades</li>
                ))}
              </ul>
            </div>
            <div className="w-1/2 pl-4">
              <h4 className="font-semibold">Quiebre por Ubicación:</h4>
              <ul className="ml-4 list-disc">
                {summary.breakByStore.map(([store, breakQty]) => (
                  <li key={store} className="text-gray-700 my-4">{store}: {breakQty} unidades en quiebre</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Stockout Sku-Stores */}
          <div className="mt-4">
            <button
              onClick={() => setIsSkuBreakExpanded(!isSkuBreakExpanded)}
              className="font-semibold text-black-600 hover:underline focus:outline-none mb-6"
            >
              Quiebre por SKU en cada Tienda {isSkuBreakExpanded ? <ChevronDownIcon className="inline h-6 w-6" /> : <ChevronRightIcon className="inline h-6 w-6" />}
            </button>
            {isSkuBreakExpanded && (
              <div>
                {summary.breakByStoreSku.map(([store, skuData]) => (
                  <div key={store} className="ml-4">
                    <div className="mb-4 flex items-center cursor-pointer" onClick={() => toggleStoreExpansion(store)}>
                      {expandedStores[store] ? <ChevronDownIcon className="h-6 w-6 text-gray-600" /> : <ChevronRightIcon className="h-6 w-6 text-gray-600" />}
                      <h5 className="text-gray-700 font-semibold ml-2">{store}</h5>
                    </div>
                    {expandedStores[store] && (
                      <ul className="list-disc ml-8">
                        {Object.entries(skuData).map(([sku, breakQty]) => (
                          <li key={`${store}-${sku}`} className="text-gray-700">{sku}: {breakQty} unidades en quiebre</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Replenishment Confirm Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleConfirmReplenishment}
            className="w-1/3 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            Confirmar Reposición
          </button>
        </div>

        {/* Confirm Modal */}
        {isConfirmModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-1/2 shadow-lg">
              <h3 className="text-xl font-bold mb-4">¿Está seguro de confirmar la reposición?</h3>
              
              {/* Checkboxes */}
              <div className="mb-4 space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={saveDeliveriesSelected}
                  onChange={(e) => setSaveDeliveriesSelected(e.target.checked)}
                />
                <span>Guardar selección de deliveries</span>
              </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox"/>
                  <span>Enviar mail con archivo</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox"/>
                  <span>Crear reposiciones en ERP</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox"/>
                  <span>Enviar agrupado de CC</span>
                </label>
              </div>

              {/* Modal buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    await handleSaveReplenishmentRecord();
                    setIsConfirmModalOpen(false);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        </>
      )}
    </div>
  );
}
