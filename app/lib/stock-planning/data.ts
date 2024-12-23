import { executeQuery } from '@/app/lib/snowflakeClient';
import { unstable_noStore as noStore } from 'next/cache';
import {
  StockSegment, CDStockData, StoresStockData, SalesData, ReplenishmentRecord
} from './../definitions';

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
  const allColumns = ["SKU", "DELIVERY", "COYHAIQUE", "LASCONDES", "MALLSPORT", "COSTANERA", "CONCEPCION", 
                      "PTOVARAS", "LADEHESA", "PUCON", "TEMUCO", "OSORNO", "ALERCE", "BNAVENTURA"];
  const dataColumns = Object.keys(data[0]);
  const missingColumns = allColumns.filter(col => !dataColumns.includes(col));
  if (missingColumns.length > 0) {
    throw new Error(`El archivo de carga no contiene las columnas necesarias: ${missingColumns.join(', ')}`);
  }
  const sqlText = `
    INSERT INTO PATAGONIA.CORE_TEST.PATCORE_SEGMENTATION (${allColumns.join(', ')})
    VALUES ${data.map(() => `(${allColumns.map(() => '?').join(', ')})`).join(', ')}
  `;
  const binds = data.flatMap(segment => allColumns.map(col => segment[col as keyof StockSegment]));
  await executeQuery(sqlText, binds);
}


/**
 * Function to fetch stock segments from the database with optional delivery filtering.
 * @param query - The search query.
 * @param page - The page number.
 * @param selectedDeliveryOptions - Array of selected delivery values.
 * @returns A promise with the stock segments.
 * @throws An error if the query fails.
 */
export async function fetchStockSegments(
  query: string,
  page: number,
  selectedDeliveryOptions: string[] = [],
  noPagination: boolean = false,
  sortKey?: string,
  sortDirection?: 'asc' | 'desc'
): Promise<StockSegment[]> {
  const limit = noPagination ? '' : 'LIMIT 10';
  const offset = noPagination ? '' : `OFFSET ${(page - 1) * 10}`;

  let sqlText = `
    SELECT * 
    FROM PATAGONIA.CORE_TEST.PATCORE_SEGMENTATION
    WHERE 1=1
  `;
  
  const binds: any[] = [];

  if (query) {
    sqlText += ` AND (UPPER(SKU) LIKE ? OR UPPER(DELIVERY) LIKE ?)`;
    binds.push(`%${query.toUpperCase()}%`, `%${query.toUpperCase()}%`);
  }

  if (selectedDeliveryOptions.length > 0) {
    sqlText += ` AND DELIVERY IN (${selectedDeliveryOptions.map(() => '?').join(', ')})`;
    binds.push(...selectedDeliveryOptions);
  }

  // Validate sortKey to prevent SQL injection
  const validSortKeys = [
    'SKU', 'DELIVERY', 'COYHAIQUE', 'LASCONDES', 'MALLSPORT', 'COSTANERA',
    'CONCEPCION', 'PTOVARAS', 'LADEHESA', 'PUCON', 'TEMUCO', 'OSORNO',
    'ALERCE', 'BNAVENTURA'
  ];

  let orderByClause = 'ORDER BY SKU'; // default order

  if (sortKey && validSortKeys.includes(sortKey.toUpperCase())) {
    orderByClause = `ORDER BY ${sortKey.toUpperCase()} ${sortDirection === 'desc' ? 'DESC' : 'ASC'}`;
  }

  sqlText += ` ${orderByClause} ${limit} ${offset}`;

  return await executeQuery<StockSegment>(sqlText, binds);
}


/**
 * Function to fetch the total count of stock segments from the database with optional delivery filtering.
 * @param query - The search query.
 * @param selectedDeliveryOptions - Array of selected delivery values.
 * @returns A promise with the total count of stock segments.
 * @throws An error if the query fails.
 */
export async function fetchStockSegmentsCount(query: string, selectedDeliveryOptions: string[] = []): Promise<number> {
  let sqlText = `
    SELECT COUNT(*) AS TOTALCOUNT 
    FROM PATAGONIA.CORE_TEST.PATCORE_SEGMENTATION
    WHERE 1=1
  `;

  const binds: any[] = [];

  if (query) {
    sqlText += ` AND (UPPER(SKU) LIKE ? OR UPPER(DELIVERY) LIKE ?)`;
    binds.push(`%${query.toUpperCase()}%`, `%${query.toUpperCase()}%`);
  }

  if (selectedDeliveryOptions.length > 0) {
    sqlText += ` AND DELIVERY IN (${selectedDeliveryOptions.map(() => '?').join(', ')})`;
    binds.push(...selectedDeliveryOptions);
  }

  const result = await executeQuery<{ TOTALCOUNT: number }>(sqlText, binds);
  return result[0].TOTALCOUNT;
}


/**
 * Function to fetch all unique DELIVERY options from the segmentation table.
 * @returns A promise with the list of unique DELIVERY values.
 * @throws An error if the query fails.
 */
export async function fetchAllDeliveryOptions(): Promise<string[]> {
  const sqlText = `
    SELECT DISTINCT DELIVERY 
    FROM PATAGONIA.CORE_TEST.PATCORE_SEGMENTATION
    WHERE DELIVERY IS NOT NULL
  `;
  
  const result = await executeQuery<{ DELIVERY: string }>(sqlText, []);
  return result.map(row => row.DELIVERY);
}


/**
 * Function to fetch sales data from the database with pivot.
 */
export async function fetchSalesData(
  query: string,
  startDate: string,
  endDate: string,
  page: number,
  noPagination: boolean = false,
  sortKey?: string,
  sortDirection?: 'asc' | 'desc'
): Promise<SalesData[]> {
  const limit = noPagination ? '' : 'LIMIT 10';
  const offset = noPagination ? '' : `OFFSET ${(page - 1) * 10}`;
  const validSortKeys = [
    'SKU', 'CD', 'COYHAIQUE', 'LASCONDES', 'MALLSPORT', 'COSTANERA', 
    'CONCEPCION', 'PTOVARAS', 'LADEHESA', 'PUCON', 'TEMUCO', 
    'OSORNO', 'ALERCE', 'BNAVENTURA'
  ];

  let orderByClause = 'ORDER BY SKU';
  if (sortKey && validSortKeys.includes(sortKey.toUpperCase())) {
    orderByClause = `ORDER BY ${sortKey.toUpperCase()} ${sortDirection === 'desc' ? 'DESC' : 'ASC'}`;
  }

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
      AND (
        INVOICEID LIKE '39-%'
        OR INVOICEID LIKE '33-%'
      )
      AND UPPER(CANAL) <> 'ECOMERCE'
    GROUP BY SKU
    ${orderByClause} ${limit} ${offset};
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
      AND (
        INVOICEID LIKE '39-%'
        OR INVOICEID LIKE '33-%'
      );
    `
    : `
    SELECT COUNT(DISTINCT SKU) AS TOTALCOUNT
    FROM PATAGONIA.CORE_TEST.ERP_PROCESSED_SALESLINE
    WHERE INVOICEDATE BETWEEN ? AND ?
      AND (
        INVOICEID LIKE '39-%'
        OR INVOICEID LIKE '33-%'
      );
    `;
  const binds = [startDate, endDate, `%${query.toUpperCase()}%`];
  const result = await executeQuery<{ TOTALCOUNT: number }>(sqlText, binds);
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

/**
 * Function to save replenishment data to the database.
 * @param record - The replenishment record to save.
 * @returns A promise with the result of the operation.
 * @throws An error if the operation fails.
 * @example
 * await saveReplenishment(record);
 */
export async function saveReplenishment(record: ReplenishmentRecord): Promise<void> {
  const {
    ID,
    TOTAL_REPLENISHMENT,
    TOTAL_BREAK_QTY,
    SELECTED_DELIVERIES,
    START_DATE,
    END_DATE,
    STORES_CONSIDERED,
    REPLENISHMENT_DATA,
  } = record;

  const sqlInsertReplenishment = `
    INSERT INTO PATAGONIA.CORE_TEST.PATCORE_REPLENISHMENTS (
      ID, TOTAL_REPLENISHMENT, TOTAL_BREAK_QTY, SELECTED_DELIVERIES, START_DATE, END_DATE, STORES_CONSIDERED, SNOWFLAKE_CREATED_AT
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);
  `;

  const sqlInsertReplenishmentLine = `
    INSERT INTO PATAGONIA.CORE_TEST.PATCORE_REPLENISHMENTS_LINE (
      REPLENISHMENT_ID, SKU, STORE, SEGMENT, SALES, ACTUAL_STOCK, ORDERED_QTY, REPLENISHMENT, SNOWFLAKE_CREATED_AT
    )
    VALUES ${REPLENISHMENT_DATA.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)').join(', ')};
  `;

  const replenishmentLineBinds = REPLENISHMENT_DATA.flatMap((line) => [
    ID,
    line.SKU,
    line.STORE,
    line.SEGMENT,
    line.SALES,
    line.ACTUAL_STOCK,
    line.ORDERED_QTY,
    line.REPLENISHMENT,
  ]);

  try {
    // Save the replenishment header record
    await executeQuery(sqlInsertReplenishment, [
      ID,
      TOTAL_REPLENISHMENT,
      TOTAL_BREAK_QTY,
      SELECTED_DELIVERIES,
      START_DATE,
      END_DATE,
      STORES_CONSIDERED,
    ]);

    // Save the replenishment line items
    await executeQuery(sqlInsertReplenishmentLine, replenishmentLineBinds);
  } catch (error) {
    console.error('Error saving replenishment data:', error);
    throw error;
  }
}


/**
 * Function to fetch replenishment data from the database.
 * @param query - The search query.
 * @param page - The page number.
 * @param limit - The number of records per page.
 * @returns A promise with the replenishment data.
 * @example
 * const replenishmentData = await fetchReplenishmentData('sku', 1, 10);
 */
export async function getReplenishments(
  query: string,
  page: number,
  limit: number
): Promise<{ records: ReplenishmentRecord[]; totalCount: number }> {
  const offset = (page - 1) * limit;

  let sql = `
    SELECT
      ID,
      TOTAL_REPLENISHMENT,
      TOTAL_BREAK_QTY,
      SELECTED_DELIVERIES,
      START_DATE,
      END_DATE,
      STORES_CONSIDERED,
      TO_CHAR(SNOWFLAKE_CREATED_AT, 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') AS CREATED_AT
    FROM PATAGONIA.CORE_TEST.PATCORE_REPLENISHMENTS
  `;

  const binds: any[] = [];

  if (query) {
    sql += `
      WHERE
        UPPER(ID) LIKE ?
        OR UPPER(SELECTED_DELIVERIES) LIKE ?
        OR UPPER(STORES_CONSIDERED) LIKE ?
    `;
    const q = `%${query.toUpperCase()}%`;
    binds.push(q, q, q);
  }

  sql += `
    ORDER BY SNOWFLAKE_CREATED_AT DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const records = await executeQuery<ReplenishmentRecord>(sql, binds);

  // Total count query
  let countSql = `
    SELECT COUNT(*) AS TOTAL_COUNT
    FROM PATAGONIA.CORE_TEST.PATCORE_REPLENISHMENTS
  `;

  if (query) {
    countSql += `
      WHERE
        UPPER(ID) LIKE ?
        OR UPPER(SELECTED_DELIVERIES) LIKE ?
        OR UPPER(STORES_CONSIDERED) LIKE ?
    `;
  }

  const countResult = await executeQuery<{ TOTAL_COUNT: number }>(countSql, binds);
  const totalCount = countResult[0]?.TOTAL_COUNT || 0;

  return { records, totalCount };
}

/**
 * Function to fetch replenishment data from the database.
 * @param query - The search query.
 * @param page - The page number.
 * @returns A promise with the replenishment data.
 * @example
 * const replenishmentData = await fetchReplenishmentData('sku', 1);
 */
export async function saveSegmentationHistory(stockSegments: StockSegment[], repID: string): Promise<void> {
  const sqlText = `
    INSERT INTO PATAGONIA.CORE_TEST.PATCORE_SEGMENTATION_HISTORY (
      REP_ID, SKU, COYHAIQUE, LASCONDES, MALLSPORT, COSTANERA,
      CONCEPCION, PTOVARAS, LADEHESA, PUCON, TEMUCO, OSORNO,
      ALERCE, BNAVENTURA, DELIVERY, SNOWFLAKE_CREATED_AT
    )
    VALUES ${stockSegments.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)').join(', ')};
  `;

  const binds = stockSegments.flatMap(segment => [
    repID,
    segment.SKU,
    segment.COYHAIQUE,
    segment.LASCONDES,
    segment.MALLSPORT,
    segment.COSTANERA,
    segment.CONCEPCION,
    segment.PTOVARAS,
    segment.LADEHESA,
    segment.PUCON,
    segment.TEMUCO,
    segment.OSORNO,
    segment.ALERCE,
    segment.BNAVENTURA,
    segment.DELIVERY,
  ]);

  await executeQuery(sqlText, binds);
}

/**
 * Function to fetch replenishment data from the database.
 * @param query - The search query.
 * @param page - The page number.
 * @returns A promise with the replenishment data.
 * @example
 * const replenishmentData = await fetchReplenishmentData('sku', 1);
 */
export async function getReplenishmentSummary(id: string) {
  const sql = `
    SELECT
      ID,
      TOTAL_REPLENISHMENT,
      TOTAL_BREAK_QTY,
      SELECTED_DELIVERIES,
      START_DATE,
      END_DATE,
      STORES_CONSIDERED,
      SNOWFLAKE_CREATED_AT AS CREATED_AT,
      ERP_TRS_IDS
    FROM PATAGONIA.CORE_TEST.PATCORE_REPLENISHMENTS
    WHERE ID = ?
  `;

  const result = await executeQuery(sql, [id]);
  return result[0];
}

/**
 * Function to fetch replenishment data from the database.
 * @param query - The search query.
 * @param page - The page number.
 * @returns A promise with the replenishment data.
 * @example
 * const replenishmentData = await fetchReplenishmentData('sku', 1);
 */
export async function getReplenishmentLines(id: string, groupBy: string) {
  const groupByColumn = {
    SKU: 'line.SKU',
    CC: 'product.ESTILOCOLOR',
    TEAM: 'product.TEAM',
    CATEGORY: 'product.CATEGORY',
  }[groupBy || 'SKU'];

  const selectGroupBy = groupBy
    ? `
      ${groupByColumn} AS GROUPED_VALUE,
      line.STORE,
      SUM(line.SEGMENT) AS TOTAL_SEGMENT,
      SUM(line.SALES) AS TOTAL_SALES,
      SUM(line.ACTUAL_STOCK) AS TOTAL_STOCK,
      SUM(line.ORDERED_QTY) AS TOTAL_ORDERED,
      SUM(line.REPLENISHMENT) AS TOTAL_REPLENISHMENT
    `
    : `
      line.SKU AS GROUPED_VALUE,
      line.STORE,
      line.SEGMENT AS TOTAL_SEGMENT,
      line.SALES AS TOTAL_SALES,
      line.ACTUAL_STOCK AS TOTAL_STOCK,
      line.ORDERED_QTY AS TOTAL_ORDERED,
      line.REPLENISHMENT AS TOTAL_REPLENISHMENT
    `;

  const groupByClause = groupBy ? `GROUP BY ${groupByColumn}, line.STORE` : '';

  const sql = `
    SELECT
      ${selectGroupBy}
    FROM PATAGONIA.CORE_TEST.PATCORE_REPLENISHMENTS_LINE AS line
    LEFT JOIN PATAGONIA.CORE_TEST.ERP_PRODUCTS AS product ON line.SKU = product.SKU
    WHERE line.REPLENISHMENT_ID = ?
    ${groupByClause}
    ORDER BY ${groupBy ? 'GROUPED_VALUE' : 'line.SKU'};
  `;

  return await executeQuery(sql, [id]);
}


/**
 * Function to fetch replenishment data from the database.
 * @param query - The search query.
 * @param page - The page number.
 * @returns A promise with the replenishment data.
 * @example
 * const replenishmentData = await fetchReplenishmentData('sku', 1);
 */
export async function getSegmentationDetail(id: string, groupBy: string = 'SKU') {
  const groupByColumn = {
    SKU: 'PATCORE_SEGMENTATION_HISTORY.SKU',
    CC: 'ERP_PRODUCTS.ESTILOCOLOR',
    TEAM: 'ERP_PRODUCTS.TEAM',
    CATEGORY: 'ERP_PRODUCTS.CATEGORY',
  }[groupBy];

  const isDefaultGroup = groupBy === 'SKU';

  const selectGroupBy = isDefaultGroup
    ? `
      PATCORE_SEGMENTATION_HISTORY.SKU,
      PATCORE_SEGMENTATION_HISTORY.DELIVERY,
      PATCORE_SEGMENTATION_HISTORY.COYHAIQUE,
      PATCORE_SEGMENTATION_HISTORY.LASCONDES,
      PATCORE_SEGMENTATION_HISTORY.MALLSPORT,
      PATCORE_SEGMENTATION_HISTORY.COSTANERA,
      PATCORE_SEGMENTATION_HISTORY.CONCEPCION,
      PATCORE_SEGMENTATION_HISTORY.PTOVARAS,
      PATCORE_SEGMENTATION_HISTORY.LADEHESA,
      PATCORE_SEGMENTATION_HISTORY.PUCON,
      PATCORE_SEGMENTATION_HISTORY.TEMUCO,
      PATCORE_SEGMENTATION_HISTORY.OSORNO,
      PATCORE_SEGMENTATION_HISTORY.ALERCE,
      PATCORE_SEGMENTATION_HISTORY.BNAVENTURA,
      PATCORE_SEGMENTATION_HISTORY.SNOWFLAKE_CREATED_AT
    `
    : `
      ${groupByColumn} AS GROUPED_VALUE,
      SUM(PATCORE_SEGMENTATION_HISTORY.COYHAIQUE) AS COYHAIQUE,
      SUM(PATCORE_SEGMENTATION_HISTORY.LASCONDES) AS LASCONDES,
      SUM(PATCORE_SEGMENTATION_HISTORY.MALLSPORT) AS MALLSPORT,
      SUM(PATCORE_SEGMENTATION_HISTORY.COSTANERA) AS COSTANERA,
      SUM(PATCORE_SEGMENTATION_HISTORY.CONCEPCION) AS CONCEPCION,
      SUM(PATCORE_SEGMENTATION_HISTORY.PTOVARAS) AS PTOVARAS,
      SUM(PATCORE_SEGMENTATION_HISTORY.LADEHESA) AS LADEHESA,
      SUM(PATCORE_SEGMENTATION_HISTORY.PUCON) AS PUCON,
      SUM(PATCORE_SEGMENTATION_HISTORY.TEMUCO) AS TEMUCO,
      SUM(PATCORE_SEGMENTATION_HISTORY.OSORNO) AS OSORNO,
      SUM(PATCORE_SEGMENTATION_HISTORY.ALERCE) AS ALERCE,
      SUM(PATCORE_SEGMENTATION_HISTORY.BNAVENTURA) AS BNAVENTURA
    `;

    const groupByClause = isDefaultGroup
    ? `
      GROUP BY 
        PATCORE_SEGMENTATION_HISTORY.SKU, 
        PATCORE_SEGMENTATION_HISTORY.DELIVERY, 
        PATCORE_SEGMENTATION_HISTORY.SNOWFLAKE_CREATED_AT,
        PATCORE_SEGMENTATION_HISTORY.COYHAIQUE,
        PATCORE_SEGMENTATION_HISTORY.LASCONDES,
        PATCORE_SEGMENTATION_HISTORY.MALLSPORT,
        PATCORE_SEGMENTATION_HISTORY.COSTANERA,
        PATCORE_SEGMENTATION_HISTORY.CONCEPCION,
        PATCORE_SEGMENTATION_HISTORY.PTOVARAS,
        PATCORE_SEGMENTATION_HISTORY.LADEHESA,
        PATCORE_SEGMENTATION_HISTORY.PUCON,
        PATCORE_SEGMENTATION_HISTORY.TEMUCO,
        PATCORE_SEGMENTATION_HISTORY.OSORNO,
        PATCORE_SEGMENTATION_HISTORY.ALERCE,
        PATCORE_SEGMENTATION_HISTORY.BNAVENTURA
    `
    : `GROUP BY ${groupByColumn}`;

  const sql = `
    SELECT
      ${selectGroupBy}
    FROM PATAGONIA.CORE_TEST.PATCORE_SEGMENTATION_HISTORY
    ${!isDefaultGroup ? 'LEFT JOIN PATAGONIA.CORE_TEST.ERP_PRODUCTS ON PATCORE_SEGMENTATION_HISTORY.SKU = ERP_PRODUCTS.SKU' : ''}
    WHERE PATCORE_SEGMENTATION_HISTORY.REP_ID = ?
    ${groupByClause}
    ORDER BY ${isDefaultGroup ? 'PATCORE_SEGMENTATION_HISTORY.SKU' : 'GROUPED_VALUE'};
  `;

  return await executeQuery(sql, [id]);
}

/**
 * Function to fetch replenishment data from the database.
 * @param id - The replenishment ID.
 * @returns A promise with the replenishment data.
 * @example
 * const replenishmentData = await fetchReplenishmentData('id');
 */
export async function getOperationReplenishment(id: string) {
  const sql = `
    SELECT
      ROW_NUMBER() OVER (PARTITION BY rpl.STORE ORDER BY rpl.SKU) AS LINENUMBER,
      prod.ITEMNUMBER,
      'DISPONIBLE' AS ORDEREDINVENTORYSTATUSID,
      prod.COLOR AS PRODUCTCOLORID,
      prod.CONFIGURATION AS PRODUCTCONFIGURATIONID,
      prod.SIZE AS PRODUCTSIZEID,
      'GEN' AS PRODUCTSTYLEID,
      'CD' AS SHIPPINGWAREHOUSEID,
      'GENERICA' AS SHIPPINGWAREHOUSELOCATIONID,
      rpl.REPLENISHMENT AS TRANSFERQUANTITY,
      rpl.STORE AS TIENDA,
      rpl.SKU,
      prod.TEAM,
      prod.CATEGORY,
      prod.PRODUCTNAME,
      rpl.ERP_TR_ID,
      rpl.ERP_LINE_ID
    FROM PATAGONIA.CORE_TEST.PATCORE_REPLENISHMENTS_LINE rpl
    INNER JOIN PATAGONIA.CORE_TEST.ERP_PRODUCTS prod
      ON rpl.SKU = prod.SKU
    WHERE rpl.REPLENISHMENT_ID = ?
    ORDER BY rpl.STORE, LINENUMBER
  `;

  return await executeQuery(sql, [id]);
}

/**
 * Function to fetch replenishment data from the database.
 * @param id - The replenishment ID.
 * @returns A promise with the replenishment data.
 * @example
 * const replenishmentData = await fetchReplenishmentData('id');
 */
export async function updateERPInfo(
  repID: string,
  erpTRs: string,
  lines: { SKU: string; STORE: string; ERP_TR_ID: string; ERP_LINE_ID: string }[]
): Promise<void> {
  const updateHeaderSQL = `
    UPDATE PATAGONIA.CORE_TEST.PATCORE_REPLENISHMENTS
    SET ERP_TRS_IDS = ?
    WHERE ID = ?
  `;
  await executeQuery(updateHeaderSQL, [erpTRs, repID]);

  if (lines.length === 0) {
    return;
  }

  // Create temporary table
  const createTempTableSQL = `
    CREATE TEMPORARY TABLE PATAGONIA.CORE_TEST.temp_data (
      ERP_TR_ID STRING,
      ERP_LINE_ID STRING,
      REP_ID STRING,
      SKU STRING,
      STORE STRING
    )
  `;
  await executeQuery(createTempTableSQL, []);

  // Insert data into temporary table
  const insertTempDataSQL = `
    INSERT INTO PATAGONIA.CORE_TEST.temp_data (ERP_TR_ID, ERP_LINE_ID, REP_ID, SKU, STORE)
    VALUES ${lines.map(() => `(?, ?, ?, ?, ?)`).join(', ')}
  `;
  const binds = lines.flatMap(line => [
    line.ERP_TR_ID,
    line.ERP_LINE_ID,
    repID,
    line.SKU,
    line.STORE,
  ]);
  await executeQuery(insertTempDataSQL, binds);

  // Update replenishment lines with temporary data
  const updateLineSQL = `
    UPDATE PATAGONIA.CORE_TEST.PATCORE_REPLENISHMENTS_LINE l
    SET l.ERP_TR_ID = t.ERP_TR_ID,
        l.ERP_LINE_ID = t.ERP_LINE_ID
    FROM PATAGONIA.CORE_TEST.temp_data t
    WHERE l.REPLENISHMENT_ID = t.REP_ID
      AND l.SKU = t.SKU
      AND l.STORE = t.STORE
  `;
  await executeQuery(updateLineSQL, []);

  // Drop temporary table
  const dropTempTableSQL = `DROP TABLE PATAGONIA.CORE_TEST.temp_data`;
  await executeQuery(dropTempTableSQL, []);
}
