import { createTradeInRequest } from '@/app/lib/trade-in/sql-data';
import { sql } from '@vercel/postgres';
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
      rut,
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
      !rut ||
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
          rut: !rut,
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
      rut: rut,
      email: email,
      phone: phone,
      region: region || null,
      comuna: comuna || null,
      delivery_method: deliveryMethod,
      address: address || null,
      house_details: houseDetails || null,
      client_comment: clientComment || null,
      received_store_code: receivedStoreCode || null,
      status: 'solicitud_recibida',
      products: products.map(product => ({
        product_style: product.product_style,
        product_color: product.product_color,
        product_size: product.product_size,
        credit_estimated: product.credit_estimated || null,
        usage_signs: product.usage_signs,
        pilling_level: product.pilling_level,
        stains_level: product.stains_level,
        tears_holes_level: product.tears_holes_level,
        repairs_level: product.repairs_level,
        meets_minimum_requirements: product.meets_minimum_requirements !== false,
        product_images: product.product_images || [],
        calculated_state: product.calculated_state || null
      }))
    };

    // Create the trade-in request in SQL database
    const result = await createTradeInRequest(requestData);

    // After successful creation, upload images for each product if present
    if (result && result.id) {
      try {
        // Process each product for image uploads
        for (let i = 0; i < products.length; i++) {
          const product = products[i];
          
          if (product.product_images && product.product_images.length > 0) {
            // Filter for base64 images only
            const base64Images = product.product_images.filter(img => 
              typeof img === 'string' && img.startsWith('data:image/')
            );

            if (base64Images.length > 0) {
              try {
                // Get the correct URL for the upload endpoint
                const protocol = req.headers['x-forwarded-proto'] || 'http';
                const host = req.headers.host || 'localhost:3001';
                const baseUrl = `${protocol}://${host}`;
                
                console.log(`Uploading images to: ${baseUrl}/api/trade-in/upload-images`);
                
                const uploadResponse = await fetch(`${baseUrl}/api/trade-in/upload-images`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Cookie': req.headers.cookie || '' // Pass authentication
                  },
                  body: JSON.stringify({
                    images: base64Images,
                    tradeInId: result.id,
                    productId: `${i + 1}`
                  })
                });

                if (uploadResponse.ok) {
                  const uploadResult = await uploadResponse.json();
                  console.log(`Uploaded ${uploadResult.urls.length} images for product ${i + 1}`);
                  console.log('Upload result:', uploadResult);
                  
                  // Update the product with uploaded image URLs
                  if (uploadResult.urls.length > 0) {
                    try {
                      console.log(`Updating database for product: style=${product.product_style}, size=${product.product_size}, request_id=${result.id}`);
                      
                      // Update the database with the uploaded URLs
                      const updateResult = await sql`
                        UPDATE trade_in_products 
                        SET product_images = ${JSON.stringify(uploadResult.urls)}
                        WHERE request_id = ${result.id} 
                        AND product_style = ${product.product_style}
                        AND product_size = ${product.product_size}
                      `;
                      
                      console.log(`Database update result:`, updateResult);
                      console.log(`Updated ${updateResult.rowCount} rows for product ${i + 1}`);
                    } catch (dbError) {
                      console.error(`Database error updating product ${i + 1}:`, dbError);
                    }
                  }
                } else {
                  console.error(`Failed to upload images for product ${i + 1}:`, await uploadResponse.text());
                }
              } catch (uploadError) {
                console.error(`Error uploading images for product ${i + 1}:`, uploadError);
                // Don't fail the entire request if image upload fails
              }
            }
          }
        }
      } catch (imageUploadError) {
        console.error('Error during image upload process:', imageUploadError);
        // Don't fail the request if image uploads fail
      }
    }

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
