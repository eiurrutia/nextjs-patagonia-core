import { sql } from '@vercel/postgres';

export interface Store {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  region?: string;
  phone?: string;
  email?: string;
  manager_name?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  store_id?: string;
  store?: Store; // Para cuando se incluye la información de la tienda
}

/**
 * Get all active stores
 */
export async function getStores(): Promise<Store[]> {
  try {
    const result = await sql`
      SELECT * FROM stores 
      WHERE is_active = true 
      ORDER BY name
    `;
    
    return result.rows as Store[];
  } catch (error) {
    console.error('Error fetching stores:', error);
    throw error;
  }
}

/**
 * Get store by ID
 */
export async function getStoreById(id: string): Promise<Store | null> {
  try {
    const result = await sql`
      SELECT * FROM stores WHERE id = ${id}
    `;
    
    return result.rows.length > 0 ? result.rows[0] as Store : null;
  } catch (error) {
    console.error('Error fetching store by ID:', error);
    throw error;
  }
}

/**
 * Get store by code
 */
export async function getStoreByCode(code: string): Promise<Store | null> {
  try {
    const result = await sql`
      SELECT * FROM stores WHERE code = ${code}
    `;
    
    return result.rows.length > 0 ? result.rows[0] as Store : null;
  } catch (error) {
    console.error('Error fetching store by code:', error);
    throw error;
  }
}

/**
 * Get user with store information
 */
export async function getUserWithStore(userId: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT 
        u.id, u.name, u.email, u.role, u.store_id,
        s.id as store_id, s.name as store_name, s.code as store_code,
        s.address as store_address, s.city as store_city, s.region as store_region
      FROM users u
      LEFT JOIN stores s ON u.store_id = s.id
      WHERE u.id = ${userId}
    `;
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    const user: User = {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      store_id: row.store_id
    };
    
    // Add store information if user has a store
    if (row.store_id) {
      user.store = {
        id: row.store_id,
        name: row.store_name,
        code: row.store_code,
        address: row.store_address,
        city: row.store_city,
        region: row.store_region,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };
    }
    
    return user;
  } catch (error) {
    console.error('Error fetching user with store:', error);
    throw error;
  }
}

/**
 * Create a new store
 */
export async function createStore(storeData: Omit<Store, 'id' | 'created_at' | 'updated_at'>): Promise<Store> {
  try {
    const result = await sql`
      INSERT INTO stores (name, code, address, city, region, phone, email, manager_name, is_active)
      VALUES (${storeData.name}, ${storeData.code}, ${storeData.address || null}, 
              ${storeData.city || null}, ${storeData.region || null}, ${storeData.phone || null},
              ${storeData.email || null}, ${storeData.manager_name || null}, ${storeData.is_active})
      RETURNING *
    `;
    
    return result.rows[0] as Store;
  } catch (error) {
    console.error('Error creating store:', error);
    throw error;
  }
}

/**
 * Update store
 */
export async function updateStore(id: string, storeData: Partial<Omit<Store, 'id' | 'created_at' | 'updated_at'>>): Promise<Store> {
  try {
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;
    
    Object.entries(storeData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    });
    
    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }
    
    const query = `
      UPDATE stores 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    updateValues.push(id);
    
    const result = await sql.query(query, updateValues);
    
    return result.rows[0] as Store;
  } catch (error) {
    console.error('Error updating store:', error);
    throw error;
  }
}
