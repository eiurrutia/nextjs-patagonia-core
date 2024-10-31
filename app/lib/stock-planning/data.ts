import { executeQuery } from '@/app/lib/snowflakeClient';
import { unstable_noStore as noStore } from 'next/cache';
import { StockSegment, StockData } from './../definitions';

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
export async function fetchStockSegments(query: string, page: number): Promise<StockSegment[]> {
  const limit = 10;
  const offset = (page - 1) * limit;

  const sqlText = query
    ? `
      SELECT * 
      FROM PATAGONIA.CORE_TEST.PATCORE_SEGMENTATION
      WHERE UPPER(SKU) LIKE ?
      LIMIT ${limit} OFFSET ${offset}
    `
    : `
      SELECT * 
      FROM PATAGONIA.CORE_TEST.PATCORE_SEGMENTATION
      LIMIT ${limit} OFFSET ${offset}
    `;

  const binds = query ? [`%${query.toUpperCase()}%`] : [];

  return await executeQuery<StockSegment>(sqlText, binds);
}

/**
 * Function to fetch sales data from the database with pivot.
 */
export async function fetchSalesData(startDate: string, endDate: string) {
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
      AND INVOICEID LIKE '39-%'
    GROUP BY SKU
    ORDER BY SKU
  `;

  const binds = [startDate, endDate];
  return await executeQuery(sqlText, binds);
}

/**
 * Function to fetch stock data from the database with pagination.
 * @param query - The search query.
 * @param page - The page number.
 * @returns A promise with the stock data.
 */
export async function fetchStockData(query: string = '', page: number = 1): Promise<StockData[]> {
  const limit = 10;
  const offset = (page - 1) * limit;

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
    LIMIT ${limit} OFFSET ${offset};
  `;

  const binds = [`%${query.toUpperCase()}%`];

  return await executeQuery<StockData>(sqlText, binds);
}