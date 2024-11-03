import { executeQuery } from '@/app/lib/snowflakeClient';
import { unstable_noStore as noStore } from 'next/cache';
import { StockSegment, CDStockData, StoresStockData, SalesData } from './../definitions';

/**
 * Function to truncate the segmentation table.
 */
export async function truncateSegmentationTable(): Promise<void> {
  const sqlText = `TRUNCATE TABLE PATAGONIA.CORE_TEST.PATCORE_SEGMENTATION`;
  await executeQuery(sqlText, []);
}


/**
 * Function to upload stock segments to the database.
 * @param data - The stock segments to upload.
 * @returns A promise with the result of the operation.
 * @throws An error if the operation fails.
 * @example
 * await uploadStockSegments(data);
 */
export async function uploadStockSegments(data: StockSegment[]): Promise<void> {
  noStore();

  const sqlText = `
    INSERT INTO PATAGONIA.CORE_TEST.PATCORE_SEGMENTATION (
      SKU, COYHAIQUE, LASCONDES, MALLSPORT, COSTANERA, CONCEPCION, 
      PTOVARAS, LADEHESA, PUCON, TEMUCO, OSORNO, ALERCE, BNAVENTURA
    ) VALUES ${data.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')}
  `;

  const binds = data.flatMap(segment => Object.values(segment));

  await executeQuery(sqlText, binds);
}

/**
 * Function to fetch stock segments from the database.
 * @param query - The search query.
 * @param page - The page number.
 * @returns A promise with the stock segments.
 * @throws An error if the query fails.
 * @example
 * const segments = await fetchStockSegments('sku', 1); 
 */
export async function fetchStockSegments(query: string, page: number, noPagination: boolean = false): Promise<StockSegment[]> {
  const limit = noPagination ? '' : 'LIMIT 10';
  const offset = noPagination ? '' : `OFFSET ${(page - 1) * 10}`;

  const sqlText = query
    ? `
      SELECT * 
      FROM PATAGONIA.CORE_TEST.PATCORE_SEGMENTATION
      WHERE UPPER(SKU) LIKE ?
      ORDER BY SKU
      ${limit} ${offset}
    `
    : `
      SELECT * 
      FROM PATAGONIA.CORE_TEST.PATCORE_SEGMENTATION
      ORDER BY SKU
      ${limit} ${offset}
    `;

  const binds = query ? [`%${query.toUpperCase()}%`] : [];

  return await executeQuery<StockSegment>(sqlText, binds);
}


/**
 * Function to fetch the total count of stock segments from the database.
 * @param query - The search query.
 * @returns A promise with the total count of stock segments.
 * @throws An error if the query fails.
 * @example
 * const totalCount = await fetchStockSegmentsCount('sku');
 */
export async function fetchStockSegmentsCount(query: string): Promise<number> {
  const sqlText = query
    ? `
    SELECT COUNT(*) AS TOTALCOUNT 
    FROM PATAGONIA.CORE_TEST.PATCORE_SEGMENTATION
    WHERE UPPER(SKU) LIKE ?
    `
    : `
    SELECT COUNT(*) AS TOTALCOUNT 
    FROM PATAGONIA.CORE_TEST.PATCORE_SEGMENTATION
    `;

  const binds = [`%${query.toUpperCase()}%`];
  const result = await executeQuery<{ TOTALCOUNT: number }>(sqlText, binds);
  return result[0].TOTALCOUNT;
}


/**
 * Function to fetch sales data from the database with pivot.
 */
export async function fetchSalesData(
    query: string, startDate: string, endDate: string, page: number, noPagination: boolean = false
  ): Promise<SalesData[]> {
  const limit = noPagination ? '' : 'LIMIT 10';
  const offset = noPagination ? '' : `OFFSET ${(page - 1) * 10}`;
  const sqlText = `
    SELECT 
      SKU,
      SUM(CASE WHEN INVENTLOCATIONID = 'CD' THEN QTY ELSE 0 END) AS CD,
      SUM(CASE WHEN INVENTLOCATIONID = 'COYHAIQUE' THEN QTY ELSE 0 END) AS COYHAIQUE,
      SUM(CASE WHEN INVENTLOCATIONID = 'LASCONDES' THEN QTY ELSE 0 END) AS LASCONDES,
      SUM(CASE WHEN INVENTLOCATIONID = 'MALLSPORT' THEN QTY ELSE 0 END) AS MALLSPORT,
      SUM(CASE WHEN INVENTLOCATIONID = 'COSTANERA' THEN QTY ELSE 0 END) AS COSTANERA,
      SUM(CASE WHEN INVENTLOCATIONID = 'CONCEPCION' THEN QTY ELSE 0 END) AS CONCEPCION,
      SUM(CASE WHEN INVENTLOCATIONID = 'PTOVARAS' THEN QTY ELSE 0 END) AS PTOVARAS,
      SUM(CASE WHEN INVENTLOCATIONID = 'LADEHESA' THEN QTY ELSE 0 END) AS LADEHESA,
      SUM(CASE WHEN INVENTLOCATIONID = 'PUCON' THEN QTY ELSE 0 END) AS PUCON,
      SUM(CASE WHEN INVENTLOCATIONID = 'TEMUCO' THEN QTY ELSE 0 END) AS TEMUCO,
      SUM(CASE WHEN INVENTLOCATIONID = 'OSORNO' THEN QTY ELSE 0 END) AS OSORNO,
      SUM(CASE WHEN INVENTLOCATIONID = 'ALERCE' THEN QTY ELSE 0 END) AS ALERCE,
      SUM(CASE WHEN INVENTLOCATIONID = 'BNAVENTURA' THEN QTY ELSE 0 END) AS BNAVENTURA
    FROM PATAGONIA.CORE_TEST.ERP_PROCESSED_SALESLINE
    WHERE INVOICEDATE BETWEEN ? AND ?
      AND UPPER(SKU) LIKE ?
      AND INVOICEID LIKE '39-%'
    GROUP BY SKU
    ORDER BY SKU
    ${limit} ${offset};
  `;

  const binds = [startDate, endDate, `%${query.toUpperCase()}%`];
  return await executeQuery<SalesData>(sqlText, binds);
}


/**
 * Function to fetch the total count of sales data from the database.
 * @param query - The search query.
 * @returns A promise with the total count of sales data.
 * @throws An error if the query fails.
 * @example
 * const totalCount = await fetchSalesCountData('sku', '2021-01-01', '2021-12-31', 1);
 */
export async function fetchSalesCount(
  query: string, startDate: string, endDate: string, page: number
) {
  const sqlText = query
    ? `
    SELECT COUNT(DISTINCT SKU) AS TOTALCOUNT
    FROM PATAGONIA.CORE_TEST.ERP_PROCESSED_SALESLINE
    WHERE INVOICEDATE BETWEEN ? AND ?
      AND UPPER(SKU) LIKE ?
      AND INVOICEID LIKE '39-%';
    `
    : `
    SELECT COUNT(DISTINCT SKU) AS TOTALCOUNT
    FROM PATAGONIA.CORE_TEST.ERP_PROCESSED_SALESLINE
    WHERE INVOICEDATE BETWEEN ? AND ?
      AND INVOICEID LIKE '39-%';
    `;
  const binds = [startDate, endDate, `%${query.toUpperCase()}%`];
  const result = await executeQuery<{ TOTALCOUNT: number }>(sqlText, binds);
  console.log('Result!: ', result);
  console.log('TOTAL COUNT', result[0].TOTALCOUNT);
  return result[0].TOTALCOUNT;
}

/**
 * Function to fetch stock data from the database with pagination.
 * @param query - The search query.
 * @param page - The page number.
 * @returns A promise with the stock data.
 */
export async function fetchCDStockData(
    query: string = '', page: number = 1, noPagination: boolean = false
  ): Promise<CDStockData[]> {
  const limit = noPagination ? '' : 'LIMIT 10';
  const offset = noPagination ? '' : `OFFSET ${(page - 1) * 10}`;
  

  const sqlText = `
    SELECT
      REPLACE(erp.SKU, '-', '') AS SKU,
      SUM(erp.AVAILABLEONHANDQUANTITY) AS StockERP,
      COALESCE(SUM(wms.QTYSTOCK - wms.QTYPENDINGPICKING), 0) AS StockWMS,
      LEAST(SUM(erp.AVAILABLEONHANDQUANTITY), COALESCE(SUM(wms.QTYSTOCK - wms.QTYPENDINGPICKING), 0)) AS MinStock
    FROM PATAGONIA.CORE_TEST.ERP_INVENTORY AS erp
    LEFT JOIN PATAGONIA.CORE_TEST.WMS_INVENTORY AS wms 
      ON REPLACE(erp.SKU, '-', '') = wms.ITEMCODE
    WHERE REPLACE(erp.SKU, '-', '') LIKE ?
      AND erp.INVENTORYWAREHOUSEID = 'CD'
      AND UPPER(erp.INVENTORYSTATUSID) = 'DISPONIBLE'
    GROUP BY erp.SKU
    ORDER BY erp.SKU
    ${limit} ${offset};
  `;

  const binds = [`%${query.toUpperCase()}%`];

  return await executeQuery<CDStockData>(sqlText, binds);
}


/**
 * Function to fetch the total count of CD stock data from the database.
 * @param query - The search query.
 * @returns A promise with the total count of CD stock data.
 * @throws An error if the query fails.
 * @example
 * const totalCount = await fetchCDStockCount('sku');
 */
export async function fetchCDStockCount(query: string): Promise<number> {
  const sqlText = `
    SELECT COUNT(DISTINCT REPLACE(SKU, '-', '')) AS TOTALCOUNT 
    FROM PATAGONIA.CORE_TEST.ERP_INVENTORY
    WHERE REPLACE(SKU, '-', '') LIKE ?
      AND INVENTORYWAREHOUSEID = 'CD'
      AND UPPER(INVENTORYSTATUSID) = 'DISPONIBLE'
  `;
  
  const binds = [`%${query.toUpperCase()}%`];
  const result = await executeQuery<{ TOTALCOUNT: number }>(sqlText, binds);
  
  return result[0].TOTALCOUNT;
}


/**
 * Function to fetch stores stock data from the database.
 * @param query - The search query.
 * @param page - The page number.
 * @returns A promise with the stores stock data.
 * @example
 * const storesStockData = await fetchStoresStockData('sku', 1);
 */
export async function fetchStoresStockData(query: string = '', page: number, noPagination: boolean = false): Promise<StoresStockData[]> {
  const limit = noPagination ? '' : 'LIMIT 10';
  const offset = noPagination ? '' : `OFFSET ${(page - 1) * 10}`;
  
  const sqlText = `
    SELECT
      REPLACE(SKU, '-', '') AS SKU,
      SUM(CASE WHEN INVENTORYWAREHOUSEID = 'COYHAIQUE' THEN AVAILABLEONHANDQUANTITY ELSE 0 END) AS COYHAIQUE_AVAILABLE,
      SUM(CASE WHEN INVENTORYWAREHOUSEID = 'COYHAIQUE' THEN ORDEREDQUANTITY ELSE 0 END) AS COYHAIQUE_ORDERED,
      SUM(CASE WHEN INVENTORYWAREHOUSEID = 'LASCONDES' THEN AVAILABLEONHANDQUANTITY ELSE 0 END) AS LASCONDES_AVAILABLE,
      SUM(CASE WHEN INVENTORYWAREHOUSEID = 'LASCONDES' THEN ORDEREDQUANTITY ELSE 0 END) AS LASCONDES_ORDERED,
      SUM(CASE WHEN INVENTORYWAREHOUSEID = 'MALLSPORT' THEN AVAILABLEONHANDQUANTITY ELSE 0 END) AS MALLSPORT_AVAILABLE,
      SUM(CASE WHEN INVENTORYWAREHOUSEID = 'MALLSPORT' THEN ORDEREDQUANTITY ELSE 0 END) AS MALLSPORT_ORDERED,
      SUM(CASE WHEN INVENTORYWAREHOUSEID = 'COSTANERA' THEN AVAILABLEONHANDQUANTITY ELSE 0 END) AS COSTANERA_AVAILABLE,
      SUM(CASE WHEN INVENTORYWAREHOUSEID = 'COSTANERA' THEN ORDEREDQUANTITY ELSE 0 END) AS COSTANERA_ORDERED,
      SUM(CASE WHEN INVENTORYWAREHOUSEID = 'CONCEPCION' THEN AVAILABLEONHANDQUANTITY ELSE 0 END) AS CONCEPCION_AVAILABLE,
      SUM(CASE WHEN INVENTORYWAREHOUSEID = 'CONCEPCION' THEN ORDEREDQUANTITY ELSE 0 END) AS CONCEPCION_ORDERED,
      SUM(CASE WHEN INVENTORYWAREHOUSEID = 'PTOVARAS' THEN AVAILABLEONHANDQUANTITY ELSE 0 END) AS PTOVARAS_AVAILABLE,
      SUM(CASE WHEN INVENTORYWAREHOUSEID = 'PTOVARAS' THEN ORDEREDQUANTITY ELSE 0 END) AS PTOVARAS_ORDERED,
      SUM(CASE WHEN INVENTORYWAREHOUSEID = 'LADEHESA' THEN AVAILABLEONHANDQUANTITY ELSE 0 END) AS LADEHESA_AVAILABLE,
      SUM(CASE WHEN INVENTORYWAREHOUSEID = 'LADEHESA' THEN ORDEREDQUANTITY ELSE 0 END) AS LADEHESA_ORDERED,
      SUM(CASE WHEN INVENTORYWAREHOUSEID = 'PUCON' THEN AVAILABLEONHANDQUANTITY ELSE 0 END) AS PUCON_AVAILABLE,
      SUM(CASE WHEN INVENTORYWAREHOUSEID = 'PUCON' THEN ORDEREDQUANTITY ELSE 0 END) AS PUCON_ORDERED,
      SUM(CASE WHEN INVENTORYWAREHOUSEID = 'TEMUCO' THEN AVAILABLEONHANDQUANTITY ELSE 0 END) AS TEMUCO_AVAILABLE,
      SUM(CASE WHEN INVENTORYWAREHOUSEID = 'TEMUCO' THEN ORDEREDQUANTITY ELSE 0 END) AS TEMUCO_ORDERED,
      SUM(CASE WHEN INVENTORYWAREHOUSEID = 'OSORNO' THEN AVAILABLEONHANDQUANTITY ELSE 0 END) AS OSORNO_AVAILABLE,
      SUM(CASE WHEN INVENTORYWAREHOUSEID = 'OSORNO' THEN ORDEREDQUANTITY ELSE 0 END) AS OSORNO_ORDERED,
      SUM(CASE WHEN INVENTORYWAREHOUSEID = 'ALERCE' THEN AVAILABLEONHANDQUANTITY ELSE 0 END) AS ALERCE_AVAILABLE,
      SUM(CASE WHEN INVENTORYWAREHOUSEID = 'ALERCE' THEN ORDEREDQUANTITY ELSE 0 END) AS ALERCE_ORDERED,
      SUM(CASE WHEN INVENTORYWAREHOUSEID = 'BNAVENTURA' THEN AVAILABLEONHANDQUANTITY ELSE 0 END) AS BNAVENTURA_AVAILABLE,
      SUM(CASE WHEN INVENTORYWAREHOUSEID = 'BNAVENTURA' THEN ORDEREDQUANTITY ELSE 0 END) AS BNAVENTURA_ORDERED
    FROM PATAGONIA.CORE_TEST.ERP_INVENTORY
    WHERE UPPER(REPLACE(SKU, '-', '')) LIKE ?
    GROUP BY SKU
    ORDER BY SKU
    ${limit} ${offset};
  `;

  const binds = [`%${query.toUpperCase()}%`];
  return await executeQuery<StoresStockData>(sqlText, binds);
}

/**
 * Function to fetch the total count of store stock data from the database.
 * @param query - The search query.
 * @returns A promise with the total count of store stock data.
 * @throws An error if the query fails.
 * @example
 * const totalCount = await fetchStoresStockCount('sku');
 */
export async function fetchStoresStockCount(query: string): Promise<number> {
  const sqlText = `
    SELECT COUNT(DISTINCT REPLACE(SKU, '-', '')) AS TOTALCOUNT 
    FROM PATAGONIA.CORE_TEST.ERP_INVENTORY
    WHERE UPPER(REPLACE(SKU, '-', '')) LIKE ?
  `;
  
  const binds = [`%${query.toUpperCase()}%`];
  const result = await executeQuery<{ TOTALCOUNT: number }>(sqlText, binds);
  
  return result[0].TOTALCOUNT;
}