import { sql } from '@vercel/postgres';

export interface TradeInRequest {
  id: number;
  request_number: string;
  first_name: string;
  last_name: string;
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
  tears_holes_level: string;
  repairs_level: string;
  meets_minimum_requirements: boolean;
  product_images?: string[];
  created_at: Date;
  updated_at: Date;
}

export interface CreateTradeInRequestData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  region?: string;
  comuna?: string;
  delivery_method: string;
  address?: string;
  house_details?: string;
  client_comment?: string;
  products: CreateTradeInProductData[];
}

export interface CreateTradeInProductData {
  product_style: string;
  product_size: string;
  credit_range?: string;
  usage_signs: string;
  pilling_level: string;
  tears_holes_level: string;
  repairs_level: string;
  meets_minimum_requirements: boolean;
  product_images?: string[];
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
 * Create a new trade-in request with multiple products
 */
export async function createTradeInRequest(data: CreateTradeInRequestData): Promise<TradeInRequest> {
  try {
    // Start transaction
    await sql`BEGIN`;
    
    // Insert main request with temporary request_number
    const requestResult = await sql`
      INSERT INTO trade_in_requests (
        request_number, first_name, last_name, email, phone, region, comuna,
        delivery_method, address, house_details, client_comment
      ) VALUES (
        'TEMP', ${data.first_name}, ${data.last_name}, ${data.email}, 
        ${data.phone}, ${data.region || null}, ${data.comuna || null},
        ${data.delivery_method}, ${data.address || null}, ${data.house_details || null}, 
        ${data.client_comment || null}
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
          usage_signs, pilling_level, tears_holes_level, repairs_level,
          meets_minimum_requirements, product_images
        ) VALUES (
          ${request.id}, ${product.product_style}, 
          ${product.product_size}, ${product.credit_range || null},
          ${product.usage_signs}, ${product.pilling_level}, ${product.tears_holes_level}, 
          ${product.repairs_level}, ${product.meets_minimum_requirements},
          ${JSON.stringify(product.product_images || [])}
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
 * Get trade-in request by ID with products
 */
export async function getTradeInRequestById(id: number): Promise<(TradeInRequest & { products: TradeInProduct[] }) | null> {
  try {
    const requestResult = await sql`
      SELECT * FROM trade_in_requests WHERE id = ${id}
    `;
    
    if (requestResult.rows.length === 0) {
      return null;
    }
    
    const request = requestResult.rows[0] as TradeInRequest;
    
    const productsResult = await sql`
      SELECT * FROM trade_in_products WHERE request_id = ${id} ORDER BY created_at
    `;
    
    const products = productsResult.rows.map(row => ({
      ...row,
      product_images: row.product_images ? JSON.parse(row.product_images) : []
    })) as TradeInProduct[];
    
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
