import {
  fetchSalesData,
  fetchCDStockData,
  fetchStoresStockData,
  fetchStockSegments,
  fetchERPProducts,
} from '../data';
import {
  ReplenishmentData,
  SalesData,
  CDStockData,
  StoresStockData,
  StockSegment,
  BreakData,
} from '@/app/lib/definitions';

/**
 * Calculate replenishment data for all stores with prioritization.
 *
 * @param query - Search query to filter the data.
 * @param startDate - Start date for the sales data.
 * @param endDate - End date for the sales data.
 * @param selectedDeliveryOptions - Selected delivery options.
 * @param editedSegments - Edited stock segments from the client.
 * @param storePriority - Array defining the priority order of stores.
 * @returns Replenishment data and break data.
 */
export async function calculateReplenishment(
  query: string = '',
  startDate: string,
  endDate: string,
  selectedDeliveryOptions: string[] = [],
  editedSegments: StockSegment[] = [],
  storePriority: string[] = [],
  editedSales: SalesData[] = []
): Promise<{
  replenishmentTable: ReplenishmentData[];
  breakData: BreakData[];
  stockSegments: StockSegment[];
}> {
  const fetchedSalesData: SalesData[] = await fetchSalesData(query, startDate, endDate, 1, true);
  const cdStockData: CDStockData[] = await fetchCDStockData(query, 1, true);
  const storesStockData: StoresStockData[] = await fetchStoresStockData(query, 1, true);
  const fetchedStockSegments: StockSegment[] = await fetchStockSegments(
    query,
    1,
    selectedDeliveryOptions,
    true
  );
  
  // Obtener la lista única de SKUs de los datos de stock para consultar solo los productos necesarios
  const uniqueSkus = Array.from(new Set(storesStockData.map(item => item.SKU)));

  // Obtener datos de ERP_PRODUCTS para enriquecer con TEAM, CATEGORY y ESTILOCOLOR (CC)
  const erpProducts = await fetchERPProducts(uniqueSkus);

  // Merge fetched stockSegments with editedSegments
  const stockSegments = fetchedStockSegments.map((segment) => {
    const editedSegment = editedSegments.find((edited) => edited.SKU === segment.SKU);
    return editedSegment ? { ...segment, ...editedSegment } : segment;
  });

  // Merge fetched salesData with editedSales
  const salesData = fetchedSalesData.map((sale) => {
    const editedSale = editedSales.find((edited) => edited.SKU === sale.SKU);
    return editedSale ? { ...sale, ...editedSale } : sale;
  });

  // Create maps for quick lookup
  const cdStockMap = new Map(cdStockData.map((cd) => [cd.SKU, cd.MINSTOCK]));
  const salesMap = new Map(salesData.map((s) => [s.SKU, s]));
  const segmentsMap = new Map(stockSegments.map((s) => [s.SKU, s]));
  
  // Crear un mapa para los productos ERP para poder acceder a CC, TEAM, CATEGORY
  const erpProductsMap = new Map(erpProducts.map((prod) => [prod.SKU, prod]));

  const replenishmentTable: ReplenishmentData[] = [];
  const breakData: BreakData[] = [];

  storesStockData.forEach((storeStock) => {
    const { SKU, ...stockByStore } = storeStock;
    let remainingCDStock = cdStockMap.get(SKU) || 0;

    const prioritizedStores = storePriority.filter((store) => 
      stockByStore.hasOwnProperty(`${store}_AVAILABLE`)
    );

    for (const storeName of prioritizedStores) {
      const stockActual = Math.max((stockByStore as Record<string, number>)[`${storeName}_AVAILABLE`] || 0, 0);
      const orderedQuantity =
        (stockByStore as Record<string, number>)[`${storeName}_ORDERED`] || 0;
      const sales = Number(salesMap.get(SKU)?.[storeName]) || 0;
      const segment = Number(segmentsMap.get(SKU)?.[storeName]) || 0;

      if (segment === 0) continue;

      const calculatedDemand = Math.max(segment, sales);
      const replenishmentNeeded = Math.max(calculatedDemand - (stockActual + orderedQuantity), 0);

      let replenishment = Math.min(replenishmentNeeded, remainingCDStock);
      let breakQty = replenishmentNeeded - replenishment;

      if (replenishment > 0) {
        // Obtener información adicional del producto desde ERP_PRODUCTS
        const erpProduct = erpProductsMap.get(SKU);
        
        replenishmentTable.push({
          SKU,
          STORE: storeName,
          SEGMENT: segment,
          SALES: sales,
          ACTUAL_STOCK: stockActual,
          ORDERED_QTY: orderedQuantity,
          REPLENISHMENT: replenishment,
          DELIVERY: segmentsMap.get(SKU)?.DELIVERY || '',
          // Añadir información del ERP si está disponible
          CATEGORY: erpProduct?.CATEGORY || '',
          TEAM: erpProduct?.TEAM || '',
          CC: erpProduct?.ESTILOCOLOR || '',
        });
        remainingCDStock -= replenishment;
      }

      // Log break data if there's a shortage
      if (breakQty > 0) {
        breakData.push({
          SKU,
          STORE: storeName,
          BREAK_QTY: breakQty,
        });
      }
    }
  });

  return { replenishmentTable, breakData, stockSegments };
}
