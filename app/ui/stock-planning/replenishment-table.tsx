'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CardSkeleton } from '../skeletons';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { ReplenishmentData, BreakData, StockSegment } from '@/app/lib/definitions';
import { getISOWeekNumber } from '@/app/utils/dateUtils';
import { toZonedTime } from 'date-fns-tz';
import Pagination from '../pagination';

export default function ReplenishmentTable({
    startDate, 
    endDate,
    selectedDeliveryOptions,
    editedSegments,
    storePriority
  }: {
    startDate: string;
    endDate: string
    selectedDeliveryOptions: string[];
    editedSegments: StockSegment[];
    storePriority: string[];
  }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [replenishmentData, setReplenishmentData] = useState<ReplenishmentData[]>([]);
  const [breakData, setBreakData] = useState<BreakData[]>([]);
  const [segmentationData, setSegmentationData] = useState<StockSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof ReplenishmentData; direction: 'asc' | 'desc' } | null>(null);
  const [isSkuBreakExpanded, setIsSkuBreakExpanded] = useState(false);
  const [expandedStores, setExpandedStores] = useState<Record<string, boolean>>({});
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isProcessingReplenishment, setIsProcessingReplenishment] = useState(false);
  const [saveDeliveriesSelected, setSaveDeliveriesSelected] = useState(true);
  const [saveSegmentationHistory, setSaveSegmentationHistory] = useState(false);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [createERPchecked, setCreateERPChecked] = useState(false);
  const [createERPBackgroundChecked, setCreateERPBackgroundChecked] = useState(false);
  const [storeList, setStoreList] = useState<string[]>([]);
  const [progressSteps, setProgressSteps] = useState<{ message: string; completed: boolean; level: number }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [groupBy, setGroupBy] = useState<'SKU' | 'CC' | 'TEAM' | 'CATEGORY' | 'DELIVERY' | 'STORE'>('SKU');
  const itemsPerPage = 20;

  // Fetch replenishment data
  useEffect(() => {
    async function fetchReplenishmentData() {
      setLoading(true);
      try {
        const response = await fetch('/api/stock-planning/replenishment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate,
            endDate,
            selectedDeliveryOptions,
            editedSegments,
            storePriority,
          }),
        });
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
  }, [startDate, endDate, selectedDeliveryOptions, editedSegments, storePriority]);

  // Store list
  useEffect(() => {
    if (replenishmentData.length > 0) {
      const uniqueStores = Array.from(new Set(replenishmentData.map(item => item.STORE))).sort();
      setStoreList(uniqueStores); 
      setSelectedStores(uniqueStores);
    }
  }, [replenishmentData]);

  // Summary calculations
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
    
    // Identificar SKUs que no existen en el ERP (tienen CATEGORY, TEAM y CC vacíos)
    const missingSkus = replenishmentData
      .filter(item => item.CATEGORY === "" && item.TEAM === "" && item.CC === "")
      .reduce((acc, item) => {
        if (!acc[item.SKU]) {
          acc[item.SKU] = [];
        }
        if (!acc[item.SKU].includes(item.STORE)) {
          acc[item.SKU].push(item.STORE);
        }
        return acc;
      }, {} as Record<string, string[]>);

    return { 
      totalReplenishment, 
      totalSales, 
      replenishmentByStore, 
      totalInOrdered, 
      totalBreakQty, 
      breakByStore, 
      breakByStoreSku,
      missingSkus
    };
  }, [replenishmentData, breakData]);
  
  const [isMissingSkusExpanded, setIsMissingSkusExpanded] = useState(false);
  const [isUpdatingErpProducts, setIsUpdatingErpProducts] = useState(false);
  const [updateErpStatus, setUpdateErpStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [updateErpMessage, setUpdateErpMessage] = useState('');
  const [showUpdateConfirmModal, setShowUpdateConfirmModal] = useState(false);
  
  const hasMissingSkus = useMemo(() => {
    return Object.keys(summary.missingSkus || {}).length > 0;
  }, [summary.missingSkus]);
  
  function handleUpdateErpProductsClick() {
    setShowUpdateConfirmModal(true);
  }
  
  async function updateErpProducts() {
    setShowUpdateConfirmModal(false); 
    
    try {
      setIsUpdatingErpProducts(true);
      setUpdateErpStatus('loading');
      setUpdateErpMessage('Actualizando base de datos de productos...');
      
      const response = await fetch('/api/airflow/trigger-dag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dagId: 'erp_products_data',
          conf: {}
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUpdateErpStatus('success');
        setUpdateErpMessage('Base de datos de productos actualizada. Se reflejará en la próxima carga.');
      } else {
        throw new Error(data.error || 'Error al actualizar productos');
      }
    } catch (error) {
      console.error('Error al actualizar productos ERP:', error);
      setUpdateErpStatus('error');
      setUpdateErpMessage('Error al actualizar la base de datos de productos.');
    } finally {
      setTimeout(() => {
        setIsUpdatingErpProducts(false);
      }, 3000);
    }
  }

  const filteredData = useMemo(() => {
    let data = [...replenishmentData];
    if (query) {
      data = data.filter(item =>
        (item.SKU && item.SKU.toString().toUpperCase().includes(query.toUpperCase())) ||
        (item.STORE && item.STORE.toString().toUpperCase().includes(query.toUpperCase()))
      );
    }

    const groupedMap = new Map();
    data.forEach(item => {
      let groupKey;
      let uniqueKey;
      
      if (groupBy === 'STORE') {
        uniqueKey = item.STORE;
      } else {
        const groupValue = item[groupBy] || 'Sin asignar';
        uniqueKey = `${groupValue}|${item.STORE}`;
        groupKey = groupValue;
      }
      
      let groupItem = groupedMap.get(uniqueKey);
      
      if (!groupItem) {
        groupItem = {
          SEGMENT: 0,
          SALES: 0,
          ACTUAL_STOCK: 0,
          ORDERED_QTY: 0,
          REPLENISHMENT: 0,
          STORE: item.STORE
        };
        
        if (groupBy !== 'STORE') {
          groupItem[groupBy] = groupKey;
          
          if (groupBy === 'SKU' && item.DELIVERY) {
            groupItem.DELIVERY = item.DELIVERY;
          }
        }
        
        groupedMap.set(uniqueKey, groupItem);
      }
      
      groupItem.SEGMENT += Number(item.SEGMENT) || 0;
      groupItem.SALES += Number(item.SALES) || 0;
      groupItem.ACTUAL_STOCK += Number(item.ACTUAL_STOCK) || 0;
      groupItem.ORDERED_QTY += Number(item.ORDERED_QTY) || 0;
      groupItem.REPLENISHMENT += Number(item.REPLENISHMENT) || 0;
    });
    
    let result = Array.from(groupedMap.values());
    
    if (sortConfig) {
      result = result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [query, replenishmentData, sortConfig, groupBy]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = filteredData.slice(startIndex, endIndex);

  const handleSort = (key: keyof ReplenishmentData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
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

  const handleToggleStore = (store: string) => {
    setSelectedStores(prev =>
      prev.includes(store)
        ? prev.filter(s => s !== store)
        : [...prev, store]
    );
  };

  // Save replenishment record
  const handleSaveReplenishmentRecord = async () => {
    setIsProcessingReplenishment(true);
    const TIME_ZONE = 'America/Santiago';
    const today = toZonedTime(new Date(), TIME_ZONE);
    const weekNumber = getISOWeekNumber(today);
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');

    const formattedDateTime = `${year}${month}${day}_${hours}${minutes}`;
    const replenishmentID = `REP-W${weekNumber}_${formattedDateTime}`;
    const orderedSelectedStores = storePriority.filter(store => selectedStores.includes(store));
    const storesConsidered = orderedSelectedStores.join(', ');
    const batchSize = 2000;

    // Filter by selected stores
    const filteredLinesForSaving = replenishmentData.filter(item => selectedStores.includes(item.STORE));
    const filteredBreakDataForSaving = breakData.filter(item => selectedStores.includes(item.STORE));
    const totalReplenishmentForSaving = filteredLinesForSaving.reduce((sum, item) => sum + (item.REPLENISHMENT || 0), 0);
    const totalBreakQtyForSaving = filteredBreakDataForSaving.reduce((sum, item) => sum + item.BREAK_QTY, 0);

    const record = {
      ID: replenishmentID,
      TOTAL_REPLENISHMENT: totalReplenishmentForSaving,
      TOTAL_BREAK_QTY: totalBreakQtyForSaving,
      SELECTED_DELIVERIES: selectedDeliveryOptions.join(', '),
      START_DATE: startDate,
      END_DATE: endDate,
      STORES_CONSIDERED: storesConsidered,
      REPLENISHMENT_DATA: filteredLinesForSaving,
    };

    // Progress steps
    const initialSteps = [];
    if (saveDeliveriesSelected) {
      initialSteps.push({ message: 'Guardando selección de deliveries', completed: false, level: 1 });
    }
    if (saveSegmentationHistory) {
      initialSteps.push({ message: 'Guardando historial de segmentación', completed: false, level: 1 });
    }
    initialSteps.push(
      { message: 'Guardando registro de reposición', completed: false, level: 1 }
    );
    if (createERPchecked) {
      initialSteps.push(
        { message: 'Cargando repos en ERP', completed: false, level: 1 }
      );
    }
    if (createERPBackgroundChecked) {
      initialSteps.push(
        { message: 'Programando creación de repos en ERP en segundo plano', completed: false, level: 1 }
      );
    }
    setProgressSteps(initialSteps);
    try {
      console.log('Saving replenishment record:', record);
      
      // Save selected deliveries if the option is checked
      if (saveDeliveriesSelected) {
        const deliveriesStep = 'Guardando selección de deliveries';
        const resp = await fetch('/api/configs/configs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config_key: 'stock_planning_deliveries_set',
            config_name: 'Deliveries',
            config_value: selectedDeliveryOptions.join(', '),
            description: 'Deliveries configuration for stock planning',
          }),
        });
        if (!resp.ok) throw new Error('Error al guardar selección de deliveries');
        setProgressSteps(prev => prev.map(step => 
          step.message === deliveriesStep ? { ...step, completed: true, level: 1 } : step
        ));
      }

      // Save segmentation history in batches
      if (saveSegmentationHistory) {
        const batchStartTime = Date.now();
        for (let i = 0; i < segmentationData.length; i += batchSize) {
          const batch = segmentationData.slice(i, i + batchSize);

          const response = await fetch('/api/stock-planning/save-segmentation-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stockSegments: batch, repID: replenishmentID }),
          });

          if (!response.ok) {
            throw new Error(`Error al guardar el lote ${i / batchSize + 1}`);
          }

          console.log(`Lote ${i / batchSize + 1} guardado exitosamente.`);
        }
        const batchEndTime = Date.now();
        console.log(`Historial de segmentación guardado en ${batchEndTime - batchStartTime}ms`);
        const savingRecordStep = 'Guardando historial de segmentación';
        setProgressSteps(prev => prev.map(step =>
          step.message === savingRecordStep ? { ...step, completed: true, level: 1 } : step
        ));
      }

      // Save replenishment record
      {
        const savingRecordStep = 'Guardando registro de reposición';
        const resp = await fetch('/api/stock-planning/save-replenishment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record),
        });
        if (!resp.ok) throw new Error('Error al guardar el registro de reposición');
        setProgressSteps(prev => prev.map(step =>
          step.message === savingRecordStep ? { ...step, completed: true, level: 1 } : step
        ));
      }
      
      // Trigger Airflow DAG for background ERP creation if the option is checked
      if (createERPBackgroundChecked) {
        const airflowStep = 'Programando creación de repos en ERP en segundo plano';
        try {
          // Prepare a unique DAG run ID using the replenishmentID
          const dagRunId = `create_erp_${replenishmentID.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
          
          // Trigger the Airflow DAG passing the replenishmentID and user info as configuration
          const airflowResp = await fetch('/api/airflow/trigger-dag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dagId: 'erp_create_replenishments',
              dagRunId,
              conf: {
                replenishmentID,
                user: session?.user?.email || 'unknown'
              }
            }),
          });
          
          if (!airflowResp.ok) {
            throw new Error('Error al programar la creación en ERP en segundo plano');
          }
          
          const airflowData = await airflowResp.json();
          console.log('DAG programado exitosamente:', airflowData);
          
          setProgressSteps(prev => prev.map(step =>
            step.message === airflowStep ? { ...step, completed: true, level: 1 } : step
          ));
        } catch (error) {
          console.error('Error al programar el DAG de Airflow:', error);
          throw new Error('Error al programar la creación en ERP en segundo plano');
        }
      }

      // Create ERP replenishments if the option is checked
      if (createERPchecked) {
        const linesResponse = await fetch(`/api/stock-planning/operation-replenishment?id=${replenishmentID}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!linesResponse.ok) throw new Error('Error al obtener líneas enriquecidas');
        const enrichedLines = await linesResponse.json();
        const linesByStore = enrichedLines.reduce((acc: Record<string, any[]>, line: any) => {
          if (!acc[line.TIENDA]) acc[line.TIENDA] = [];
          acc[line.TIENDA].push(line);
          return acc;
        }, {});
        const stores = Object.keys(linesByStore);
  
        // Loading Replenishments in ERP
        const erpLinesWithInfo: {SKU: string; STORE: string; ERP_TR_ID: string; ERP_LINE_ID: string}[] = [];
        const erpTRNumbers: string[] = [];
  
        for (const store of stores) {
          // Create TransferHeader for this store
          const headerStep = `Creando encabezado ERP para tienda ${store}`;
          setProgressSteps(prev => [...prev, { message: headerStep, completed: false, level: 2 }]);
  
          const headerResp = await fetch('/api/stock-planning/create-erp-replenishment-header', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ replenishmentID, store })
          });
          if (!headerResp.ok) throw new Error(`Error al crear encabezado para ${store}`);
  
          const headerData = await headerResp.json();
          const transferOrderNumber = headerData.TransferOrderNumber;
          console.log('Encabezado creado para tienda: ', headerData);
  
          // Check if the header was created successfully
          setProgressSteps(prev => prev.map(step =>
            step.message === headerStep ? { ...step, completed: true, level: 2 } : step
          ));
  
          erpTRNumbers.push(transferOrderNumber);
  
          // Create lines for this Transfer Order
          const storeLines = linesByStore[store];
          const totalLines = storeLines.length;
          const lineStepBase = `Creando líneas en ERP para ${transferOrderNumber} - ${store}`;
          setProgressSteps(prev => [...prev, { message: `${lineStepBase} (0/${totalLines})`, completed: false, level: 3 }]);
  
          for (let i = 0; i < totalLines; i++) {
            const line = storeLines[i];
            const lineData = {
              transferOrderNumber,
              lineData: {
                ItemNumber: line.ITEMNUMBER,
                ProductColorId: line.PRODUCTCOLORID,
                ProductConfigurationId: line.PRODUCTCONFIGURATIONID,
                ProductSizeId: line.PRODUCTSIZEID,
                ProductStyleId: line.PRODUCTSTYLEID,
                OrderedInventoryStatusId: line.ORDEREDINVENTORYSTATUSID,
                ShippingWarehouseLocationId: line.SHIPPINGWAREHOUSELOCATIONID,
                TransferQuantity: line.TRANSFERQUANTITY,
                RequestedReceiptDate: new Date().toISOString(),
                RequestedShippingDate: new Date().toISOString(),
                SalesTaxItemGroupCodeShipment: 'IVA',
                SalesTaxItemGroupCodeReceipt: 'EXENTO',
                PriceType: 'CostPrice',
                LineNumber: i + 1
              }
            };
            
            // Create line in ERP request
            const lineResp = await fetch('/api/stock-planning/create-erp-replenishment-line', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(lineData)
            });
            if (!lineResp.ok) throw new Error(`Error al crear línea ${i + 1} para la tienda ${store}`);
  
            const lineResult = await lineResp.json();
            erpLinesWithInfo.push({
              SKU: line.SKU,
              STORE: line.TIENDA,
              ERP_TR_ID: transferOrderNumber,
              ERP_LINE_ID: lineResult.ERP_LINE_ID
            });
  
            // Update the step with the current progress (i+1 / totalLines)
            setProgressSteps(prev => prev.map(step =>
              step.message.startsWith(lineStepBase)
                ? { ...step, message: `${lineStepBase} (${i + 1}/${totalLines})`, level: 3 }
                : step
            ));
          }
  
          // Check if the lines were created successfully
          setProgressSteps(prev => prev.map(step =>
            step.message.startsWith(lineStepBase)
              ? { ...step, completed: true }
              : step
          ));
        }
        setProgressSteps(prev => prev.map(step =>
          step.message === 'Cargando repos en ERP' ? { ...step, completed: true, level: 1 } : step
        ));

        // Update ERP info in BD
        setProgressSteps(prev => [...prev, { message: 'Actualizando ERP info en BD', completed: false, level: 1 }]);
        const updateERPResp = await fetch('/api/stock-planning/update-erp-info-in-replenishment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repID: replenishmentID,
            erpTRs: erpTRNumbers.join(', '),
            lines: erpLinesWithInfo
          })
        });
  
        if (!updateERPResp.ok) {
          throw new Error('Error al actualizar info de ERP en BD');
        }

        setProgressSteps(prev => prev.map(step =>
          step.message === 'Actualizando ERP info en BD' ? { ...step, completed: true, level: 1 } : step
        ));
      }
  
      setTimeout(() => {
        alert('Reposición confirmada exitosamente');
        router.push('/stock-planning');
      }, 1000);
    } catch (error) {
      console.error('Error al guardar la reposición:', error);
      alert('Hubo un error al confirmar la reposición');
    } finally {
      setIsProcessingReplenishment(false);
      setIsConfirmModalOpen(false);
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
        
        {/* Botones de agrupación */}
        <div className="flex flex-wrap gap-2 mb-4">
          {['SKU', 'CC', 'DELIVERY', 'CATEGORY', 'TEAM', 'STORE'].map((option) => (
            <button
              key={option}
              onClick={() => {
                setGroupBy(option as 'SKU' | 'CC' | 'TEAM' | 'CATEGORY' | 'DELIVERY' | 'STORE');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded text-sm ${
                groupBy === option ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
              } hover:bg-blue-400 hover:text-white`}
            >
              {`Agrupar por ${option}`}
            </button>
          ))}
        </div>
        
        {/* Table */}
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              {/* Mostrar campo de agrupación - solo cuando no sea STORE */}
              {groupBy !== 'STORE' && (
                <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort(groupBy)}>
                  {groupBy} {sortConfig?.key === groupBy && (sortConfig.direction === 'asc' ? '🔼' : '🔽')}
                </th>
              )}
              
              {/* Mostrar Delivery solo cuando agrupamos por SKU */}
              {groupBy === 'SKU' && (
                <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('DELIVERY')}>
                  Delivery {sortConfig?.key === 'DELIVERY' && (sortConfig.direction === 'asc' ? '🔼' : '🔽')}
                </th>
              )}
              
              {/* Tienda siempre visible */}
              <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('STORE')}>
                Tienda {sortConfig?.key === 'STORE' && (sortConfig.direction === 'asc' ? '🔼' : '🔽')}
              </th>
              
              {/* Columnas numéricas siempre visibles */}
              <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('SEGMENT')}>
                Segmentación {sortConfig?.key === 'SEGMENT' && (sortConfig.direction === 'asc' ? '🔼' : '🔽')}
              </th>
              <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('SALES')}>
                Venta {sortConfig?.key === 'SALES' && (sortConfig.direction === 'asc' ? '🔼' : '🔽')}
              </th>
              <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('ACTUAL_STOCK')}>
                Stock Actual {sortConfig?.key === 'ACTUAL_STOCK' && (sortConfig.direction === 'asc' ? '🔼' : '🔽')}
              </th>
              <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('ORDERED_QTY')}>
                Ordenado {sortConfig?.key === 'ORDERED_QTY' && (sortConfig.direction === 'asc' ? '🔼' : '🔽')}
              </th>
              <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('REPLENISHMENT')}>
                Reposición {sortConfig?.key === 'REPLENISHMENT' && (sortConfig.direction === 'asc' ? '🔼' : '🔽')}
              </th>
            </tr>
          </thead>
          <tbody>
            {currentPageData.map((item, index) => (
                <tr key={index}>
                    {/* Campo de agrupación cuando no es STORE */}
                    {groupBy !== 'STORE' && (
                        <td className="border px-4 py-2">{item[groupBy]}</td>
                    )}
                    
                    {/* Mostrar Delivery solo cuando agrupamos por SKU */}
                    {groupBy === 'SKU' && (
                        <td className="border px-4 py-2">{item.DELIVERY}</td>
                    )}
                    
                    {/* Tienda siempre visible */}
                    <td className="border px-4 py-2">{item.STORE}</td>
                    
                    {/* Columnas numéricas siempre visibles */}
                    <td className="border px-4 py-2">{item.SEGMENT}</td>
                    <td className="border px-4 py-2">{item.SALES}</td>
                    <td className="border px-4 py-2">{item.ACTUAL_STOCK}</td>
                    <td className="border px-4 py-2">{item.ORDERED_QTY}</td>
                    <td className="border px-4 py-2">{item.REPLENISHMENT}</td>
                </tr>
            ))}
          </tbody>
        </table>

        {/* Warning for missing SKUs */}
        {hasMissingSkus && (
          <div className="mt-4 mb-4 p-4 border border-red-500 rounded-md bg-red-50">
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => setIsMissingSkusExpanded(!isMissingSkusExpanded)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-bold text-red-600">
                Advertencia: Tu ejercicio de reposición contempla SKUs que no existen en el ERP
              </span>
              {isMissingSkusExpanded ? (
                <ChevronDownIcon className="h-5 w-5 text-red-500 ml-2" />
              ) : (
                <ChevronRightIcon className="h-5 w-5 text-red-500 ml-2" />
              )}
            </div>
            
            {/* Status update message */}
            {isUpdatingErpProducts && (
              <div className={`mt-2 p-2 rounded text-sm ${
                updateErpStatus === 'loading' ? 'bg-blue-50 text-blue-700' : 
                updateErpStatus === 'success' ? 'bg-green-50 text-green-700' : 
                updateErpStatus === 'error' ? 'bg-red-100 text-red-700' : ''
              }`}>
                {updateErpMessage}
              </div>
            )}
            
            {isMissingSkusExpanded && (
              <div className="mt-3 ml-8">
                <p className="text-red-600 mb-2">Los siguientes SKUs no se encontraron en el ERP:</p>
                <ul className="list-disc ml-5">
                  {Object.entries(summary.missingSkus).map(([sku, stores]) => (
                    <li key={sku} className="text-red-600 mb-1">
                      <span className="font-semibold">{sku}</span> - Presente en tiendas: {stores.join(', ')}
                    </li>
                  ))}
                </ul>
                
                {/* Update ERP products button */}
                <div className="flex justify-end mt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); 
                      handleUpdateErpProductsClick();
                    }}
                    disabled={isUpdatingErpProducts}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isUpdatingErpProducts 
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                    }`}
                  >
                    {isUpdatingErpProducts ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Actualizando...
                      </>
                    ) : (
                      'Actualizar tabla de productos del ERP en Snowflake'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Update ERP products confirmation modal */}
        {showUpdateConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="text-lg font-medium mb-4">Confirmar actualización</h3>
              <p className="mb-4">¿Estás seguro que deseas actualizar la tabla de productos del ERP en Snowflake?</p>
              <p className="mb-4 text-sm text-gray-600">El proceso se ejecutará en segundo plano y toma entre 2 a 3 minutos. En caso de que el problema persista favor contactarse con quien administra la base de BYOD de productos del ERP.</p>
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => setShowUpdateConfirmModal(false)} 
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button 
                  onClick={updateErpProducts} 
                  className="px-4 py-2 bg-blue-100 text-blue-700 border border-blue-300 rounded-md hover:bg-blue-200"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-5 flex w-full justify-center">
          <Pagination totalPages={totalPages} currentPage={currentPage} setPage={setCurrentPage} />
        </div>

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
              {isProcessingReplenishment ? (
                <div className="mt-4 text-gray-700 border-t pt-4">
                  {progressSteps.map((step, index) => (
                    <div
                      key={index}
                      className={`flex items-center space-x-2 mb-2 ${
                        step.level === 1 ? 'ml-4' :
                        step.level === 2 ? 'ml-8' :
                        step.level === 3 ? 'ml-12' : ''
                      }`}
                    >
                      {step.completed ? (
                        <span className="text-green-600">✔</span>
                      ) : (
                        <span className="text-gray-400">⏳</span>
                      )}
                      <span>{step.message}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                <h3 className="text-xl font-bold mb-4">¿Está seguro de confirmar la reposición?</h3>

                  {/* Stores to consider */}
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-lg font-semibold">Tiendas a Considerar</h4>
                    <button
                      onClick={() => {
                        if (selectedStores.length === storeList.length) {
                          setSelectedStores([]);
                        } else {
                          setSelectedStores([...storeList]);
                        }
                      }}
                      className="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 transition-colors duration-200"
                    >
                      {selectedStores.length === storeList.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                    </button>
                  </div>
                  <div className="mb-4 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                      {storeList.map(store => (
                        <label key={store} className="flex items-center hover:bg-gray-50 p-2 rounded-md transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedStores.includes(store)}
                            onChange={() => handleToggleStore(store)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="ml-3 text-gray-700">{store}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Checkboxes */}
                  <h4 className="text-lg font-semibold mb-2">Acciones</h4>
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
                      <input
                        type="checkbox"
                        checked={saveSegmentationHistory}
                        onChange={(e) => setSaveSegmentationHistory(e.target.checked)}
                      />
                      <span>Guardar registro de segmentación utilizada</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                          type="checkbox"
                          checked={createERPchecked} 
                          onChange={(e) => {
                            setCreateERPChecked(e.target.checked);
                            if (e.target.checked) {
                              setCreateERPBackgroundChecked(false);
                            }
                          }}
                      />
                      <span>Crear reposiciones en ERP</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                          type="checkbox"
                          checked={createERPBackgroundChecked} 
                          onChange={(e) => {
                            setCreateERPBackgroundChecked(e.target.checked);
                            if (e.target.checked) {
                              setCreateERPChecked(false);
                            }
                          }}
                      />
                      <span>Crear reposiciones en ERP en segundo plano (Airflow)</span>
                    </label>
                  </div>
                </>
              )}

              {/* Modal buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                  disabled={isProcessingReplenishment}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveReplenishmentRecord}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  disabled={isProcessingReplenishment}
                >
                  {isProcessingReplenishment ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291l2.122-2.122A4 4 0 004 12H0c0 2.21.895 4.21 2.343 5.657l1.657 1.657z"
                        ></path>
                      </svg>
                      Procesando...
                    </span>
                  ) : (
                    'Confirmar'
                  )}
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
