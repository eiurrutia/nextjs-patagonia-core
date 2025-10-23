import { sql } from '@vercel/postgres';
import { TradeInProductMaster } from '@/app/lib/definitions';

const ITEMS_PER_PAGE = 20;

export async function fetchProductMasterPages(query: string) {
  try {
    const count = await sql`
      SELECT COUNT(*)
      FROM trade_in_product_master
      WHERE
        style_code ILIKE ${`%${query}%`} OR
        product_name ILIKE ${`%${query}%`}
    `;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of products.');
  }
}

export async function fetchFilteredProductMaster(query: string, currentPage: number) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const products = await sql<TradeInProductMaster>`
      SELECT
        id,
        style_code,
        product_name,
        condition_state,
        credit_amount,
        created_at,
        updated_at
      FROM trade_in_product_master
      WHERE
        style_code ILIKE ${`%${query}%`} OR
        product_name ILIKE ${`%${query}%`}
      ORDER BY style_code ASC, condition_state ASC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return products.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch products.');
  }
}

export async function fetchProductMasterById(id: number) {
  try {
    const product = await sql<TradeInProductMaster>`
      SELECT
        id,
        style_code,
        product_name,
        condition_state,
        credit_amount,
        created_at,
        updated_at
      FROM trade_in_product_master
      WHERE id = ${id}
    `;

    return product.rows[0] || null;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch product.');
  }
}

export async function checkDuplicateProduct(styleCode: string, conditionState: string, excludeId?: number) {
  try {
    const query = excludeId
      ? sql`
          SELECT id FROM trade_in_product_master
          WHERE style_code = ${styleCode}
          AND condition_state = ${conditionState}
          AND id != ${excludeId}
        `
      : sql`
          SELECT id FROM trade_in_product_master
          WHERE style_code = ${styleCode}
          AND condition_state = ${conditionState}
        `;

    const result = await query;
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to check duplicate product.');
  }
}