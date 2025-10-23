'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { TradeInProductMasterCSV } from '@/app/lib/definitions';

const FormSchema = z.object({
  id: z.number(),
  styleCode: z.string({
    invalid_type_error: 'Please enter a style code.',
  }).min(1, 'Style code is required.'),
  productName: z.string({
    invalid_type_error: 'Please enter a product name.',
  }).min(1, 'Product name is required.'),
  conditionState: z.enum(['CN', 'DU', 'RP'], {
    invalid_type_error: 'Please select a condition state.',
  }),
  creditAmount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
});

const CreateProduct = FormSchema.omit({ id: true });
const UpdateProduct = FormSchema.omit({ id: true });

export type State = {
  errors?: {
    styleCode?: string[];
    productName?: string[];
    conditionState?: string[];
    creditAmount?: string[];
  };
  message?: string | null;
};

export async function createProductMaster(prevState: State, formData: FormData) {
  const validatedFields = CreateProduct.safeParse({
    styleCode: formData.get('styleCode'),
    productName: formData.get('productName'),
    conditionState: formData.get('conditionState'),
    creditAmount: formData.get('creditAmount'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Product.',
    };
  }

  const { styleCode, productName, conditionState, creditAmount } = validatedFields.data;

  try {
    // Check for duplicate combination
    const duplicate = await sql`
      SELECT id FROM trade_in_product_master
      WHERE style_code = ${styleCode} AND condition_state = ${conditionState}
    `;

    if (duplicate.rows.length > 0) {
      return {
        message: `Product with style code "${styleCode}" and condition "${conditionState}" already exists.`,
      };
    }

    await sql`
      INSERT INTO trade_in_product_master (style_code, product_name, condition_state, credit_amount)
      VALUES (${styleCode}, ${productName}, ${conditionState}, ${creditAmount})
    `;
  } catch (error) {
    console.error('Database Error:', error);
    return {
      message: 'Database Error: Failed to Create Product.',
    };
  }

  revalidatePath('/dashboard/trade-in/config');
  redirect('/dashboard/trade-in/config');
}

export async function updateProductMaster(id: number, prevState: State, formData: FormData) {
  const validatedFields = UpdateProduct.safeParse({
    styleCode: formData.get('styleCode'),
    productName: formData.get('productName'),
    conditionState: formData.get('conditionState'),
    creditAmount: formData.get('creditAmount'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Product.',
    };
  }

  const { styleCode, productName, conditionState, creditAmount } = validatedFields.data;

  try {
    // Check for duplicate combination (excluding current record)
    const duplicate = await sql`
      SELECT id FROM trade_in_product_master
      WHERE style_code = ${styleCode} 
      AND condition_state = ${conditionState}
      AND id != ${id}
    `;

    if (duplicate.rows.length > 0) {
      return {
        message: `Product with style code "${styleCode}" and condition "${conditionState}" already exists.`,
      };
    }

    await sql`
      UPDATE trade_in_product_master
      SET style_code = ${styleCode}, 
          product_name = ${productName}, 
          condition_state = ${conditionState}, 
          credit_amount = ${creditAmount},
          updated_at = NOW()
      WHERE id = ${id}
    `;
  } catch (error) {
    console.error('Database Error:', error);
    return {
      message: 'Database Error: Failed to Update Product.',
    };
  }

  revalidatePath('/dashboard/trade-in/config');
  redirect('/dashboard/trade-in/config');
}

export async function deleteProductMaster(id: number) {
  try {
    await sql`DELETE FROM trade_in_product_master WHERE id = ${id}`;
    revalidatePath('/dashboard/trade-in/config');
    return { message: 'Deleted Product.' };
  } catch (error) {
    console.error('Database Error:', error);
    return { message: 'Database Error: Failed to Delete Product.' };
  }
}

interface BulkUploadResult {
  success: boolean;
  created: number;
  updated: number;
  errors: string[];
  message: string;
}

export async function bulkUploadProductMaster(csvData: TradeInProductMasterCSV[]): Promise<BulkUploadResult> {
  console.log('🚀 Starting bulk upload with', csvData.length, 'rows');
  
  let created = 0;
  let updated = 0;
  const errors: string[] = [];
  const BATCH_SIZE = 100; // Procesar 100 productos por lote
  
  try {
    // Process in batches to avoid timeout
    for (let batchStart = 0; batchStart < csvData.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, csvData.length);
      const batch = csvData.slice(batchStart, batchEnd);
      
      console.log(`� Processing batch ${Math.floor(batchStart/BATCH_SIZE) + 1}/${Math.ceil(csvData.length/BATCH_SIZE)} (rows ${batchStart + 1}-${batchEnd})`);
      
      for (let index = 0; index < batch.length; index++) {
        const globalIndex = batchStart + index;
        const row = batch[index];
        const lineNumber = globalIndex + 2; // Account for header row

        try {
          // Validate required fields
          if (!row.Estilo || !row['PRODUCT NAME'] || !row.Estado || row.Credito === undefined) {
            errors.push(`Line ${lineNumber}: Missing required fields`);
            continue;
          }

          // Validate condition state
          if (!['CN', 'DU', 'RP'].includes(row.Estado)) {
            errors.push(`Line ${lineNumber}: Invalid condition state "${row.Estado}". Must be CN, DU, or RP`);
            continue;
          }

          // Validate credit amount - clean currency formatting first
          const cleanCreditText = String(row.Credito).replace(/[$.,]/g, ''); // Remove $, dots, and commas
          const creditAmount = Number(cleanCreditText);
          if (isNaN(creditAmount) || creditAmount <= 0) {
            errors.push(`Line ${lineNumber}: Invalid credit amount "${row.Credito}". Must be a positive number`);
            continue;
          }

          // Check if product exists
          const existing = await sql`
            SELECT id FROM trade_in_product_master
            WHERE style_code = ${row.Estilo} AND condition_state = ${row.Estado}
          `;

          if (existing.rows.length > 0) {
            // Update existing product
            console.log(`🔄 Updating product: ${row.Estilo}-${row.Estado}`);
            await sql`
              UPDATE trade_in_product_master
              SET product_name = ${row['PRODUCT NAME']}, 
                  credit_amount = ${creditAmount},
                  updated_at = NOW()
              WHERE style_code = ${row.Estilo} AND condition_state = ${row.Estado}
            `;
            updated++;
          } else {
            // Create new product
            console.log(`✅ Creating product: ${row.Estilo}-${row.Estado}`);
            await sql`
              INSERT INTO trade_in_product_master (style_code, product_name, condition_state, credit_amount)
              VALUES (${row.Estilo}, ${row['PRODUCT NAME']}, ${row.Estado}, ${creditAmount})
            `;
            created++;
          }
        } catch (rowError) {
          console.error(`❌ Error on line ${lineNumber}:`, rowError);
          errors.push(`Line ${lineNumber}: Database error - ${rowError}`);
        }
      }
      
      // Small delay between batches to avoid overwhelming the database
      if (batchEnd < csvData.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('✅ Bulk upload completed:', { created, updated, errors: errors.length });
    revalidatePath('/dashboard/trade-in/config');

    return {
      success: true,
      created,
      updated,
      errors,
      message: `Upload completed. Created: ${created}, Updated: ${updated}${errors.length > 0 ? `, Errors: ${errors.length}` : ''}`
    };

  } catch (error) {
    console.error('💥 Bulk Upload Error:', error);
    return {
      success: false,
      created: 0,
      updated: 0,
      errors: [`General error: ${error}`],
      message: 'Bulk upload failed due to a system error.'
    };
  }
}