import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { sql } from '@vercel/postgres';
import { updateProductVerification, createTradeInComment } from '@/app/lib/trade-in/sql-data';
import { evaluateProductCondition } from '@/app/lib/trade-in/product-condition-evaluator';

// Aux function to get the confirmed value (modified or original)
function getConfirmedValue(product, modifications, field) {
  const modification = modifications.find(mod => mod.questionId === field);
  if (modification) {
    // For boolean fields, convert string to boolean
    if (field === 'meets_minimum_requirements') {
      return modification.newValue === 'true' || modification.newValue === true;
    }
    return modification.newValue;
  }
  return product[field];
}

// Aux function to generate change comment
function generateChangeComment(modifiedConditions, products) {
  const changes = modifiedConditions.map(mod => {
    const product = products.find(p => p.id == mod.productId);
    const productName = product ? `${product.product_style} (Talla: ${product.product_size})` : `Producto ${mod.productId}`;
    
    const conditionLabels = {
      'usage_signs': 'Señales de uso',
      'pilling_level': 'Nivel de pilling',
      'tears_holes_level': 'Roturas/agujeros',
      'repairs_level': 'Reparaciones',
      'stains_level': 'Manchas',
      'meets_minimum_requirements': 'Cumple requisitos mínimos'
    };
    
    const conditionLabel = conditionLabels[mod.questionId] || mod.questionId;
    return `* ${productName}: ${conditionLabel} cambiado de "${mod.originalValue}" a "${mod.newValue}"`;
  });
  
  return `Verificación en tienda realizada. Cambios:\n${changes.join('\n')}`;
}

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

  if (req.method !== 'POST' && req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const {
      firstName,
      lastName,
      rut,
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
      originalDeliveryMethod,
      modifiedConditions = [],
      productRepairs = []
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'ID is required' });
    }

    const requestId = parseInt(id, 10);
    if (isNaN(requestId)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // Get products from database to have complete information
    const existingProducts = await sql`
      SELECT * FROM trade_in_products WHERE request_id = ${requestId}
    `;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !existingProducts.rows || existingProducts.rows.length === 0) {
      return res.status(400).json({ message: 'Missing required fields or no products found' });
    }

    // Start transaction
    await sql`BEGIN`;

    try {
      // 1. Process verification of ALL products (not just modified ones)
      for (const product of existingProducts.rows) {
        const productModifications = modifiedConditions.filter(mod => mod.productId == product.id);
        const productRepairData = productRepairs.find(pr => pr.productId == product.id);

        console.log(`Processing product ${product.id}:`, {
          modifications: productModifications,
          repairs: productRepairData
        });

        // Get confirmed values (modified or original)
        const confirmedValues = {
          confirmed_usage_signs: getConfirmedValue(product, productModifications, 'usage_signs'),
          confirmed_pilling_level: getConfirmedValue(product, productModifications, 'pilling_level'),
          confirmed_tears_holes_level: getConfirmedValue(product, productModifications, 'tears_holes_level'),
          confirmed_repairs_level: getConfirmedValue(product, productModifications, 'repairs_level'),
          confirmed_stains_level: getConfirmedValue(product, productModifications, 'stains_level'),
          confirmed_meets_minimum_requirements: getConfirmedValue(product, productModifications, 'meets_minimum_requirements')
        };


        // Calculate confirmed state using evaluation logic
        const conditionResponses = {
          usage_signs: confirmedValues.confirmed_usage_signs,
          pilling_level: confirmedValues.confirmed_pilling_level,
          tears_holes_level: confirmedValues.confirmed_tears_holes_level,
          repairs_level: confirmedValues.confirmed_repairs_level,
          stains_level: confirmedValues.confirmed_stains_level
        };

        const confirmedCalculatedState = evaluateProductCondition(conditionResponses);

        // Prepare repairs (separated by ";")
        const repairFields = {
          tears_holes_repairs: productRepairData?.tears_holes_repairs?.join(';') || null,
          repairs_level_repairs: productRepairData?.repairs_level_repairs?.join(';') || null,
          stains_level_repairs: productRepairData?.stains_level_repairs?.join(';') || null
        };


        const verificationData = {
          ...confirmedValues,
          confirmed_calculated_state: confirmedCalculatedState,
          ...repairFields,
          store_verified_by: 'sistema_tienda'
        };

        // Update product verification (ALWAYS, not just if there are modifications)
        try {
          await updateProductVerification(product.id, verificationData);
          console.log(`✅ Successfully updated product ${product.id}`);
        } catch (error) {
          console.error(`❌ Error updating product ${product.id}:`, error);
          throw error;
        }
      }

      // 2. Create log comment if there are modifications
      if (modifiedConditions.length > 0) {
        const commentText = generateChangeComment(modifiedConditions, existingProducts.rows);
        const contextData = {
          modified_conditions: modifiedConditions,
          products_affected: existingProducts.rows.map(p => p.id),
          repair_selections: productRepairs
        };

        await createTradeInComment(
          requestId,
          'product_verification',
          commentText,
          contextData,
          'sistema_tienda'
        );
      }

      // 3. Update the main trade-in request
      await sql`
        UPDATE trade_in_requests 
        SET 
          first_name = ${firstName},
          last_name = ${lastName},
          rut = ${rut || null},
          email = ${email},
          phone = ${phone},
          region = ${region || null},
          comuna = ${comuna || null},
          address = ${address || null},
          house_details = ${houseDetails || null},
          client_comment = ${client_comment || null},
          delivery_method = ${deliveryMethod},
          status = ${status || 'recepcionado_tienda'},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${requestId}
      `;

      // Update existing products with any new information if provided
      if (products && products.length > 0) {
        for (const product of products) {
          // Only update if the product exists and has changes
          const existingProduct = existingProducts.rows.find(ep => ep.product_style === product.product_style && ep.product_size === product.product_size);
          if (existingProduct) {
            await sql`
              UPDATE trade_in_products 
              SET 
                credit_range = ${product.credit_range || existingProduct.credit_range},
                usage_signs = ${product.usage_signs || existingProduct.usage_signs},
                pilling_level = ${product.pilling_level || existingProduct.pilling_level},
                tears_holes_level = ${product.tears_holes_level || existingProduct.tears_holes_level},
                repairs_level = ${product.repairs_level || existingProduct.repairs_level},
                stains_level = ${product.stains_level || existingProduct.stains_level},
                meets_minimum_requirements = ${product.meets_minimum_requirements !== undefined ? product.meets_minimum_requirements : existingProduct.meets_minimum_requirements},
                product_images = ${JSON.stringify(product.product_images || existingProduct.product_images || [])},
                calculated_state = ${product.calculated_state || existingProduct.calculated_state},
                updated_at = CURRENT_TIMESTAMP
              WHERE id = ${existingProduct.id}
            `;
          }
        }
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
