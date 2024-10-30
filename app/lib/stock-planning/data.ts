import { executeQuery } from '@/app/lib/snowflakeClient';
import { unstable_noStore as noStore } from 'next/cache';
import { StockSegment } from './../definitions';


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
    TRUNCATE TABLE PATAGONIA.CORE_TEST.PATCORE_SEGMENTATION;
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
