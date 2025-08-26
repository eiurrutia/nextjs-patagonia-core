import { createTradeInRequest } from '@/app/lib/trade-in/sql-data';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

/**
 * API route handler for creating a new Trade-In request with multiple products
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 */
export default async function handler(req, res) {
  // Check if the request is authenticated (optional for public trade-in submissions)
  const session = await getServerSession(req, res, authOptions);

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Extract data from the request body
    const {
      firstName,
      lastName,
      email,
      phone,
      region,
      comuna,
      deliveryMethod,
      address,
      houseDetails,
      clientComment,
      products,
      receivedStoreCode // Nuevo campo para cuando es recepción en tienda
    } = req.body;

    // Special validation: Store receptions require authentication
    if (deliveryMethod === 'store' && !session) {
      return res.status(401).json({ message: 'Store receptions require authentication' });
    }

    // Validate that all required fields are present
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !deliveryMethod ||
      !products ||
      !Array.isArray(products) ||
      products.length === 0
    ) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: {
          firstName: !firstName,
          lastName: !lastName,
          email: !email,
          phone: !phone,
          deliveryMethod: !deliveryMethod,
          products: !products || !Array.isArray(products) || products.length === 0
        }
      });
    }

    // Validate each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      if (
        !product.product_style ||
        !product.product_size ||
        !product.usage_signs ||
        !product.pilling_level ||
        !product.tears_holes_level ||
        !product.repairs_level
      ) {
        return res.status(400).json({
          message: `Product ${i + 1} is missing required fields`,
          productIndex: i,
          product: product,
          missingFields: {
            product_style: !product.product_style,
            product_size: !product.product_size,
            usage_signs: !product.usage_signs,
            pilling_level: !product.pilling_level,
            tears_holes_level: !product.tears_holes_level,
            repairs_level: !product.repairs_level
          }
        });
      }
    }

    // Prepare data for database insertion
    const requestData = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      region: region || null,
      comuna: comuna || null,
      delivery_method: deliveryMethod,
      address: address || null,
      house_details: houseDetails || null,
      client_comment: clientComment || null,
      received_store_code: receivedStoreCode || null, // Nuevo campo
      status: deliveryMethod === 'store' ? 'recepcionado_tienda' : 'solicitud_recibida', // Estado inicial según tipo
      products: products.map(product => ({
        product_style: product.product_style,
        product_color: product.product_color,
        product_size: product.product_size,
        credit_range: product.credit_range || null,
        usage_signs: product.usage_signs,
        pilling_level: product.pilling_level,
        tears_holes_level: product.tears_holes_level,
        repairs_level: product.repairs_level,
        meets_minimum_requirements: product.meets_minimum_requirements !== false,
        product_images: product.product_images || [],
        calculated_state: product.calculated_state || null
      }))
    };

    // Create the trade-in request in SQL database
    const result = await createTradeInRequest(requestData);

    // Return success response
    return res.status(201).json({
      message: 'Trade-in request created successfully',
      request: result,
      requestNumber: result.request_number
    });

  } catch (error) {
    console.error('Error creating trade-in request:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
