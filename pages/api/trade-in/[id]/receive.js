import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { sql } from '@vercel/postgres';

/**
 * API route handler for receiving/confirming a Trade-In request in store
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 */
export default async function handler(req, res) {
  // Check if the request is authenticated
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const {
      firstName,
      lastName,
      email,
      phone,
      region,
      comuna,
      address,
      houseDetails,
      client_comment,
      deliveryMethod,
      products,
      status,
      receivedInStore,
      originalDeliveryMethod
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'ID is required' });
    }

    const requestId = parseInt(id, 10);
    if (isNaN(requestId)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !products || products.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Start transaction
    await sql`BEGIN`;

    try {
      // Update the main trade-in request
      await sql`
        UPDATE trade_in_requests 
        SET 
          first_name = ${firstName},
          last_name = ${lastName},
          email = ${email},
          phone = ${phone},
          region = ${region || null},
          comuna = ${comuna || null},
          address = ${address || null},
          house_details = ${houseDetails || null},
          client_comment = ${client_comment || null},
          delivery_method = ${deliveryMethod},
          status = ${status || 'received'},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${requestId}
      `;

      // Delete existing products for this request
      await sql`
        DELETE FROM trade_in_products 
        WHERE request_id = ${requestId}
      `;

      // Insert updated products
      for (const product of products) {
        await sql`
          INSERT INTO trade_in_products (
            request_id,
            product_style,
            product_size,
            credit_range,
            usage_signs,
            pilling_level,
            tears_holes_level,
            repairs_level,
            meets_minimum_requirements,
            product_images,
            calculated_state,
            created_at,
            updated_at
          ) VALUES (
            ${requestId},
            ${product.product_style},
            ${product.product_size},
            ${product.credit_range || null},
            ${product.usage_signs},
            ${product.pilling_level},
            ${product.tears_holes_level},
            ${product.repairs_level},
            ${product.meets_minimum_requirements},
            ${JSON.stringify(product.product_images || [])},
            ${product.calculated_state || null},
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
        `;
      }

      // Commit transaction
      await sql`COMMIT`;

      res.status(200).json({
        success: true,
        message: 'Trade-in request received successfully',
        id: requestId
      });

    } catch (error) {
      // Rollback transaction on error
      await sql`ROLLBACK`;
      throw error;
    }

  } catch (error) {
    console.error('Error processing trade-in reception:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
