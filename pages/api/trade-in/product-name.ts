import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

/**
 * API endpoint to get product name from master table by style code
 * GET /api/trade-in/product-name?styleCode=88557
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'No autorizado. Debes iniciar sesión.' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { styleCode } = req.query;

  if (!styleCode || typeof styleCode !== 'string') {
    return res.status(400).json({ message: 'styleCode is required' });
  }

  try {
    // Query the master table to get the product name
    // We only need one result since all entries with the same style_code have the same product_name
    const result = await sql`
      SELECT product_name
      FROM trade_in_product_master
      WHERE style_code = ${styleCode}
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found', productName: null });
    }

    const productName = result.rows[0].product_name;

    return res.status(200).json({ 
      productName,
      styleCode 
    });

  } catch (error) {
    console.error('Error fetching product name from master table:', error);
    return res.status(500).json({ 
      message: 'Error fetching product name',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
