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
  StockSegment
} from '@/app/lib/definitions';


export async function calculateReplenishment(
    query: string = '', startDate: string, endDate: string
): Promise<ReplenishmentData[]> {
    // 1. Fetch all data without pagination
    const salesData: SalesData[] = await fetchSalesData(query, startDate, endDate, 1, true);
    const cdStockData: CDStockData[] = await fetchCDStockData(query, 1, true);
    const storesStockData: StoresStockData[] = await fetchStoresStockData(query, 1, true);
    const stockSegments: StockSegment[] = await fetchStockSegments(query, 1, true);
  
    // Map data for easier access
    const cdStockMap = new Map(cdStockData.map(cd => [cd.SKU, cd.MINSTOCK]));
    const salesMap = new Map(salesData.map(s => [s.SKU, s]));
    const segmentsMap = new Map(stockSegments.map(s => [s.SKU, s]));
  
    // Final table for all SKUs and stores
    const replenishmentTable: ReplenishmentData[] = [];
  
    // Process each SKU's data across all stores
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
    
            const calculatedDemand = Math.max(segment, sales);
            const replenishmentNeeded = Math.max(calculatedDemand - (stockActual + orderedQuantity), 0);
            const replenishment = Math.min(replenishmentNeeded, remainingCDStock);

            if (segment === 0) continue;

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
      }
    });
    return replenishmentTable;
  }
  