import {
  fetchSalesData,
  fetchCDStockData,
  fetchStoresStockData,
  fetchStockSegments
} from '../data';
import {
ReplenishmentData,
SalesData,
CDStockData,
StoresStockData,
StockSegment,
BreakData
} from '@/app/lib/definitions';

/**
 * Calculate replenishment data for all stores.
 * 
 * @param query - Search query to filter the data.
 * @param startDate - Start date for the sales data.
 * @param endDate - End date for the sales data.
 * @returns Replenishment data and break data.
 */
export async function calculateReplenishment(
  query: string = '',
  startDate: string,
  endDate: string,
  selectedDeliveryOptions: string[] = []
): Promise<{
  replenishmentTable: ReplenishmentData[],
  breakData: BreakData[],
  stockSegments: StockSegment[]
 }> {
  const salesData: SalesData[] = await fetchSalesData(query, startDate, endDate, 1, true);
  const cdStockData: CDStockData[] = await fetchCDStockData(query, 1, true);
  const storesStockData: StoresStockData[] = await fetchStoresStockData(query, 1, true);
  const stockSegments: StockSegment[] = await fetchStockSegments(query, 1, selectedDeliveryOptions, true);

  const cdStockMap = new Map(cdStockData.map(cd => [cd.SKU, cd.MINSTOCK]));
  const salesMap = new Map(salesData.map(s => [s.SKU, s]));
  const segmentsMap = new Map(stockSegments.map(s => [s.SKU, s]));

  const replenishmentTable: ReplenishmentData[] = [];
  const breakData: BreakData[] = [];

  storesStockData.forEach(storeStock => {
    const { SKU, ...stockByStore } = storeStock;
    let remainingCDStock = cdStockMap.get(SKU) || 0;

    for (const store in stockByStore) {
      if (store.endsWith('_AVAILABLE')) {
          const storeName = store.replace('_AVAILABLE', '');
          const stockActual = (stockByStore as Record<string, number>)[`${storeName}_AVAILABLE`];
          const orderedQuantity = (stockByStore as Record<string, number>)[`${storeName}_ORDERED`] || 0;
          const sales = Number(salesMap.get(SKU)?.[storeName]) || 0;
          const segment = Number(segmentsMap.get(SKU)?.[storeName]) || 0;

          if (segment === 0) continue;

          const calculatedDemand = Math.max(segment, sales);
          const replenishmentNeeded = Math.max(calculatedDemand - (stockActual + orderedQuantity), 0);
          
          let replenishment = Math.min(replenishmentNeeded, remainingCDStock);
          let breakQty = replenishmentNeeded - replenishment;
          
          if (replenishment > 0) {
              replenishmentTable.push({
                  SKU,
                  STORE: storeName,
                  SEGMENT: segment,
                  SALES: sales,
                  ACTUAL_STOCK: stockActual,
                  ORDERED_QTY: orderedQuantity,
                  REPLENISHMENT: replenishment,
              });
              remainingCDStock -= replenishment;
          }

          // Log break data if there's a shortage
          if (breakQty > 0) {
              breakData.push({
                  SKU,
                  STORE: storeName,
                  BREAK_QTY: breakQty
              });
          }
      }
    }
  });

  return { replenishmentTable, breakData, stockSegments };
}
