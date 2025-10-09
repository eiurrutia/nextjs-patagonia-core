import { sql } from '@vercel/postgres';
import { unstable_noStore as noStore } from 'next/cache';

export interface TradeInRequest {
  id: number;
  request_number: string;
  first_name: string;
  last_name: string;
  rut: string;
  email: string;
  phone: string;
  region?: string;
  comuna?: string;
  delivery_method: string;
  address?: string;
  house_details?: string;
  status: string;
  client_comment?: string;
  admin_notes?: string;
  received_store_code?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TradeInProduct {
  id: number;
  request_id: number;
  product_style: string;
  product_size: string;
  credit_range?: string;
  usage_signs: string;
  pilling_level: string;
  stains_level: string;
  tears_holes_level: string;
  repairs_level: string;
  meets_minimum_requirements: boolean;
  product_images?: string[];
  calculated_state?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTradeInRequestData {
  first_name: string;
  last_name: string;
  rut: string;
  email: string;
  phone: string;
  region?: string;
  comuna?: string;
  delivery_method: string;
  address?: string;
  house_details?: string;
  client_comment?: string;
  received_store_code?: string;
  status?: string;
  products: CreateTradeInProductData[];
}

export interface CreateTradeInProductData {
  product_style: string;
  product_size: string;
  credit_range?: string;
  usage_signs: string;
  pilling_level: string;
  stains_level: string;
  tears_holes_level: string;
  repairs_level: string;
  meets_minimum_requirements: boolean;
  product_images?: string[];
  calculated_state?: string;
}

/**
 * Generate request number based on the record ID
 */
function generateRequestNumber(id: number): string {
  // Format with leading zeros for numbers up to 9999, then continue without padding
  const formattedNumber = id <= 9999 
    ? id.toString().padStart(4, '0')
    : id.toString();
  
  return `TI${formattedNumber}`;
}

/**
 * Generate confirmed SKU based on product information and confirmed state
 * Format: W{codigo-item}{iniciales-estado}-{color}-{talla}
 * Example: W26270CN-NTPL-M for "Como Nuevo" state
 */
function generateConfirmedSku(productStyle: string, productSize: string, confirmedState: string): string {
  // Extract item code and color from product style
  // Product style format is usually: {codigo-item}-{color}
  const parts = productStyle.split('-');
  const itemCode = parts[0] || '';
  const color = parts[1] || '';
  
  // Map confirmed states to initials
  const stateInitials: Record<string, string> = {
    'como nuevo': 'CN',
    'con detalles de uso': 'DU',
    'detalle de uso': 'DU',
    'detalles de uso': 'DU',
    'reparado': 'RP',
    'reciclado': 'IN'
  };
  
  const normalizedState = confirmedState?.toLowerCase().trim();
  const stateCode = stateInitials[normalizedState] || 'XX';
  
  // Format: W{codigo-item}{iniciales-estado}-{color}-{talla}
  return `W${itemCode}${stateCode}-${color}-${productSize}`;
}

/**
 * Create a new trade-in request with multiple products
 */
export async function createTradeInRequest(data: CreateTradeInRequestData): Promise<TradeInRequest> {
  try {
    // Start transaction
    await sql`BEGIN`;
    
    // Insert main request with temporary request_number
    const requestResult = await sql`
      INSERT INTO trade_in_requests (
        request_number, first_name, last_name, rut, email, phone, region, comuna,
        delivery_method, address, house_details, client_comment, received_store_code, status
      ) VALUES (
        'TEMP', ${data.first_name}, ${data.last_name}, ${data.rut}, ${data.email}, 
        ${data.phone}, ${data.region || null}, ${data.comuna || null},
        ${data.delivery_method}, ${data.address || null}, ${data.house_details || null}, 
        ${data.client_comment || null}, ${data.received_store_code || null}, ${data.status || 'solicitud_recibida'}
      ) RETURNING *
    `;
    
    const request = requestResult.rows[0] as TradeInRequest;
    
    // Generate request number based on the auto-generated ID
    const requestNumber = generateRequestNumber(request.id);
    
    // Update the request with the generated request_number
    await sql`
      UPDATE trade_in_requests 
      SET request_number = ${requestNumber}
      WHERE id = ${request.id}
    `;
    
    // Update the request object with the generated request_number
    request.request_number = requestNumber;
    
    // Insert products
    for (const product of data.products) {
      await sql`
        INSERT INTO trade_in_products (
          request_id, product_style, product_size, credit_range,
          usage_signs, pilling_level, stains_level, tears_holes_level, repairs_level,
          meets_minimum_requirements, product_images, calculated_state
        ) VALUES (
          ${request.id}, ${product.product_style}, 
          ${product.product_size}, ${product.credit_range || null},
          ${product.usage_signs}, ${product.pilling_level}, ${product.stains_level},
          ${product.tears_holes_level}, ${product.repairs_level}, ${product.meets_minimum_requirements},
          ${JSON.stringify(product.product_images || [])}, ${product.calculated_state || null}
        )
      `;
    }
    
    // Commit transaction
    await sql`COMMIT`;
    
    return request;
  } catch (error) {
    // Rollback transaction on error
    await sql`ROLLBACK`;
    console.error('Error creating trade-in request:', error);
    throw error;
  }
}

/**
 * Fetch trade-in requests with pagination and search
 */
export async function fetchTradeInRequests(query: string, currentPage: number): Promise<(TradeInRequest & { productCount: number })[]> {
  noStore(); // Disable caching for this function
  
  const pageSize = 20;
  const offset = (currentPage - 1) * pageSize;
  
  try {
    const searchQuery = `%${query.toLowerCase()}%`;
    
    // Add a timestamp comment to ensure query is always fresh
    const timestamp = new Date().getTime();
    
    const result = await sql`
      SELECT 
        tr.id, tr.request_number, tr.first_name, tr.last_name, tr.rut, tr.email, 
        tr.phone, tr.region, tr.comuna, tr.delivery_method, tr.address, 
        tr.status, tr.client_comment, tr.received_store_code,
        tr.created_at AT TIME ZONE 'UTC' as created_at,
        tr.updated_at AT TIME ZONE 'UTC' as updated_at,
        COUNT(tp.id) as product_count,
        ${timestamp} as query_timestamp
      FROM trade_in_requests tr
      LEFT JOIN trade_in_products tp ON tr.id = tp.request_id
      WHERE 
        LOWER(tr.first_name) LIKE ${searchQuery} OR 
        LOWER(tr.last_name) LIKE ${searchQuery} OR 
        LOWER(tr.rut) LIKE ${searchQuery} OR
        LOWER(tr.email) LIKE ${searchQuery} OR 
        LOWER(tr.phone) LIKE ${searchQuery} OR
        LOWER(tr.request_number) LIKE ${searchQuery}
      GROUP BY tr.id, tr.request_number, tr.first_name, tr.last_name, tr.rut, tr.email, 
               tr.phone, tr.region, tr.comuna, tr.delivery_method, tr.address, 
               tr.status, tr.client_comment, tr.received_store_code, tr.created_at, tr.updated_at
      ORDER BY tr.created_at DESC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `;
    
    return result.rows.map(row => ({
      ...row,
      productCount: parseInt(row.product_count) || 0
    })) as (TradeInRequest & { productCount: number })[];
    
  } catch (error) {
    console.error('Error fetching trade-in requests:', error);
    throw error;
  }
}

/**
 * Get trade-in request by ID with products
 */
export async function getTradeInRequestById(id: number): Promise<(TradeInRequest & { products: TradeInProduct[] }) | null> {
  try {
    const requestResult = await sql`
      SELECT 
        id, request_number, first_name, last_name, rut, email, phone, region, comuna, 
        delivery_method, address, received_store_code, status, client_comment,
        created_at AT TIME ZONE 'UTC' as created_at,
        updated_at AT TIME ZONE 'UTC' as updated_at
      FROM trade_in_requests WHERE id = ${id}
    `;
    
    if (requestResult.rows.length === 0) {
      return null;
    }
    
    const request = requestResult.rows[0] as TradeInRequest;
    
    const productsResult = await sql`
      SELECT * FROM trade_in_products WHERE request_id = ${id} ORDER BY created_at
    `;
    
    const products = productsResult.rows.map(row => {
      let productImages = [];
      
      try {
        // Since product_images is JSON type in PostgreSQL, it comes already parsed
        if (row.product_images) {
          if (Array.isArray(row.product_images)) {
            productImages = row.product_images;
          } else if (typeof row.product_images === 'string') {
            // Fallback for string format
            productImages = JSON.parse(row.product_images);
          }
        }
      } catch (parseError) {
        console.warn('Error parsing product_images for product:', row.id, parseError);
        productImages = [];
      }
      
      return {
        ...row,
        product_images: Array.isArray(productImages) ? productImages : []
      };
    }) as TradeInProduct[];
    
    return { ...request, products };
  } catch (error) {
    console.error('Error fetching trade-in request:', error);
    throw error;
  }
}

/**
 * Get all trade-in requests with pagination
 */
export async function getTradeInRequests(page: number = 1, limit: number = 10): Promise<{ requests: TradeInRequest[], total: number }> {
  try {
    const offset = (page - 1) * limit;
    
    const requestsResult = await sql`
      SELECT * FROM trade_in_requests 
      ORDER BY created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    const countResult = await sql`
      SELECT COUNT(*) as total FROM trade_in_requests
    `;
    
    const requests = requestsResult.rows as TradeInRequest[];
    const total = parseInt(countResult.rows[0].total);
    
    return { requests, total };
  } catch (error) {
    console.error('Error fetching trade-in requests:', error);
    throw error;
  }
}

/**
 * Update trade-in request status
 */
export async function updateTradeInRequestStatus(id: number, status: string, adminNotes?: string): Promise<void> {
  try {
    await sql`
      UPDATE trade_in_requests 
      SET status = ${status}, admin_notes = ${adminNotes || null}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;
  } catch (error) {
    console.error('Error updating trade-in request status:', error);
    throw error;
  }
}

/**
 * Get configuration value
 */
export async function getConfigValue(key: string): Promise<string | null> {
  try {
    const result = await sql`
      SELECT config_value FROM patcore_configurations WHERE config_key = ${key}
    `;
    
    return result.rows.length > 0 ? result.rows[0].config_value : null;
  } catch (error) {
    console.error('Error fetching config value:', error);
    return null;
  }
}

// Store verification functions
export async function updateProductVerification(
  productId: number,
  verificationData: {
    confirmed_usage_signs?: string;
    confirmed_pilling_level?: string;
    confirmed_tears_holes_level?: string;
    confirmed_repairs_level?: string;
    confirmed_stains_level?: string;
    confirmed_meets_minimum_requirements?: boolean;
    confirmed_calculated_state?: string;
    tears_holes_repairs?: string;
    repairs_level_repairs?: string;
    stains_level_repairs?: string;
    store_verified_by?: string;
  }
): Promise<void> {
  try {
    // First, get the current product data to generate the confirmed_sku
    const productResult = await sql`
      SELECT product_style, product_size 
      FROM trade_in_products 
      WHERE id = ${productId}
    `;

    let confirmedSku = null;
    
    // Generate confirmed_sku if we have a confirmed_calculated_state and product data
    if (verificationData.confirmed_calculated_state && productResult.rows.length > 0) {
      const product = productResult.rows[0];
      confirmedSku = generateConfirmedSku(
        product.product_style,
        product.product_size,
        verificationData.confirmed_calculated_state
      );
    }

    // Update the product with all verification data including the generated SKU
    await sql`
      UPDATE trade_in_products 
      SET 
        confirmed_usage_signs = ${verificationData.confirmed_usage_signs || null},
        confirmed_pilling_level = ${verificationData.confirmed_pilling_level || null},
        confirmed_tears_holes_level = ${verificationData.confirmed_tears_holes_level || null},
        confirmed_repairs_level = ${verificationData.confirmed_repairs_level || null},
        confirmed_stains_level = ${verificationData.confirmed_stains_level || null},
        confirmed_meets_minimum_requirements = ${verificationData.confirmed_meets_minimum_requirements || null},
        confirmed_calculated_state = ${verificationData.confirmed_calculated_state || null},
        confirmed_sku = ${confirmedSku},
        tears_holes_repairs = ${verificationData.tears_holes_repairs || null},
        repairs_level_repairs = ${verificationData.repairs_level_repairs || null},
        stains_level_repairs = ${verificationData.stains_level_repairs || null},
        store_verified_at = CURRENT_TIMESTAMP,
        store_verified_by = ${verificationData.store_verified_by || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${productId}
    `;
  } catch (error) {
    console.error('Error updating product verification:', error);
    throw error;
  }
}

export async function createTradeInComment(
  requestId: number,
  commentType: string,
  comment: string,
  contextData: any,
  createdBy: string
): Promise<void> {
  try {
    await sql`
      INSERT INTO trade_in_request_comments 
      (request_id, comment_type, comment, context_data, created_by)
      VALUES (${requestId}, ${commentType}, ${comment}, ${JSON.stringify(contextData)}, ${createdBy})
    `;
  } catch (error) {
    console.error('Error creating trade-in comment:', error);
    throw error;
  }
}

export async function getTradeInComments(requestId: number): Promise<any[]> {
  try {
    const result = await sql`
      SELECT 
        id,
        comment_type,
        comment,
        context_data,
        created_by,
        created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Santiago' as created_at
      FROM trade_in_request_comments 
      WHERE request_id = ${requestId}
      ORDER BY created_at DESC
    `;
    
    return result.rows;
  } catch (error) {
    console.error('Error fetching trade-in comments:', error);
    throw error;
  }
}

export async function addTradeInComment(
  requestId: number, 
  comment: string, 
  createdBy: string, 
  commentType: string = 'manual_comment'
): Promise<any> {
  try {
    const result = await sql`
      INSERT INTO trade_in_request_comments 
        (request_id, comment_type, comment, created_by, created_at)
      VALUES 
        (${requestId}, ${commentType}, ${comment}, ${createdBy}, NOW())
      RETURNING 
        id,
        comment_type,
        comment,
        created_by,
        created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Santiago' as created_at
    `;
    
    return result.rows[0];
  } catch (error) {
    console.error('Error adding trade-in comment:', error);
    throw error;
  }
}

export async function updateTradeInStatus(requestId: number, status: string): Promise<void> {
  try {
    await sql`
      UPDATE trade_in_requests 
      SET 
        status = ${status},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${requestId}
    `;

    // Si el trade-in pasa a "recepcionado_tienda", actualizar todos sus productos a "en_tienda"
    if (status === 'recepcionado_tienda') {
      await updateProductsStatusToEnTienda(requestId);
    }
  } catch (error) {
    console.error('Error updating trade-in status:', error);
    throw error;
  }
}

/**
 * Update products status to "en_tienda" when trade-in is received in store
 */
export async function updateProductsStatusToEnTienda(requestId: number): Promise<void> {
  try {
    await sql`
      UPDATE trade_in_products 
      SET 
        product_status = 'en_tienda',
        updated_at = CURRENT_TIMESTAMP
      WHERE request_id = ${requestId} AND product_status IS NULL
    `;
  } catch (error) {
    console.error('Error updating products status to en_tienda:', error);
    throw error;
  }
}

/**
 * Update individual product status
 */
export async function updateProductStatus(
  productId: number, 
  status: 'en_tienda' | 'etiqueta_generada' | 'empacado' | 'enviado',
  updatedBy?: string
): Promise<void> {
  try {
    await sql`
      UPDATE trade_in_products 
      SET 
        product_status = ${status},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${productId}
    `;
  } catch (error) {
    console.error('Error updating product status:', error);
    throw error;
  }
}

/**
 * Get trade-in product by ID with complete information
 */
export async function getTradeInProductById(productId: number): Promise<any | null> {
  try {
    const result = await sql`
      SELECT 
        tp.*,
        tp.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Santiago' as created_at,
        tp.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Santiago' as updated_at,
        tp.store_verified_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Santiago' as store_verified_at,
        tr.request_number,
        tr.first_name,
        tr.last_name,
        tr.email,
        tr.phone,
        tr.status as request_status,
        tr.delivery_method,
        tr.address,
        tr.region,
        tr.comuna,
        tr.received_store_code
      FROM trade_in_products tp
      INNER JOIN trade_in_requests tr ON tp.request_id = tr.id
      WHERE tp.id = ${productId}
    `;
    
    if (result.rows.length === 0) {
      return null;
    }

    const product = result.rows[0];
    
    // Parse product_images if it exists
    let productImages = [];
    try {
      if (product.product_images) {
        if (Array.isArray(product.product_images)) {
          productImages = product.product_images;
        } else if (typeof product.product_images === 'string') {
          productImages = JSON.parse(product.product_images);
        }
      }
    } catch (parseError) {
      console.warn('Error parsing product_images for product:', productId, parseError);
      productImages = [];
    }

    return {
      ...product,
      product_images: Array.isArray(productImages) ? productImages : []
    };
  } catch (error) {
    console.error('Error fetching trade-in product:', error);
    throw error;
  }
}

/**
 * Fetch all trade-in products with request information
 */
export async function fetchTradeInProducts(query: string, currentPage: number): Promise<any[]> {
  noStore(); // Disable caching for this function
  
  const pageSize = 20;
  const offset = (currentPage - 1) * pageSize;
  
  try {
    const searchQuery = `%${query.toLowerCase()}%`;
    
    // Add a timestamp comment to ensure query is always fresh
    const timestamp = new Date().getTime();
    
    const result = await sql`
      SELECT 
        tp.id,
        tp.request_id,
        tp.product_style,
        tp.product_size,
        tp.credit_range,
        tp.usage_signs,
        tp.pilling_level,
        tp.stains_level,
        tp.tears_holes_level,
        tp.repairs_level,
        tp.meets_minimum_requirements,
        tp.calculated_state,
        tp.confirmed_usage_signs,
        tp.confirmed_pilling_level,
        tp.confirmed_tears_holes_level,
        tp.confirmed_repairs_level,
        tp.confirmed_stains_level,
        tp.confirmed_meets_minimum_requirements,
        tp.confirmed_calculated_state,
        tp.confirmed_sku,
        tp.product_status,
        tp.store_verified_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Santiago' as store_verified_at,
        tp.store_verified_by,
        tp.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Santiago' as created_at,
        tp.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Santiago' as updated_at,
        tr.request_number,
        tr.first_name,
        tr.last_name,
        tr.email,
        tr.phone,
        tr.status as request_status,
        ${timestamp} as query_timestamp
      FROM trade_in_products tp
      INNER JOIN trade_in_requests tr ON tp.request_id = tr.id
      WHERE 
        LOWER(tp.product_style) LIKE ${searchQuery} OR 
        LOWER(tp.product_size) LIKE ${searchQuery} OR 
        LOWER(tp.calculated_state) LIKE ${searchQuery} OR
        LOWER(tp.confirmed_calculated_state) LIKE ${searchQuery} OR
        LOWER(tp.confirmed_sku) LIKE ${searchQuery} OR
        LOWER(tp.product_status) LIKE ${searchQuery} OR
        LOWER(tr.request_number) LIKE ${searchQuery} OR
        LOWER(tr.first_name) LIKE ${searchQuery} OR 
        LOWER(tr.last_name) LIKE ${searchQuery} OR
        LOWER(tr.email) LIKE ${searchQuery}
      ORDER BY tp.created_at DESC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `;
    
    return result.rows;
    
  } catch (error) {
    console.error('Error fetching trade-in products:', error);
    throw error;
  }
}
