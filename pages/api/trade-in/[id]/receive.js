import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { sql } from '@vercel/postgres';
import { updateProductVerification, createTradeInComment } from '@/app/lib/trade-in/sql-data';

// Función auxiliar para obtener el valor confirmado (modificado o original)
function getConfirmedValue(product, modifications, field) {
  const modification = modifications.find(mod => mod.questionId === field);
  return modification ? modification.newValue : product[field];
}

// Función auxiliar para generar comentario de cambios
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
      // 1. Si hay modificaciones o reparaciones, procesarlas primero
      if (modifiedConditions.length > 0 || productRepairs.length > 0) {
        // Procesar verificación de productos usando datos de la BD
        for (const product of existingProducts.rows) {
          const productModifications = modifiedConditions.filter(mod => mod.productId == product.id);
          const productRepairData = productRepairs.find(pr => pr.productId == product.id);

          if (productModifications.length > 0 || productRepairData) {
            // Preparar los valores confirmados (usar modificados o originales)
            const confirmedValues = {
              confirmed_usage_signs: getConfirmedValue(product, productModifications, 'usage_signs'),
              confirmed_pilling_level: getConfirmedValue(product, productModifications, 'pilling_level'),
              confirmed_tears_holes_level: getConfirmedValue(product, productModifications, 'tears_holes_level'),
              confirmed_repairs_level: getConfirmedValue(product, productModifications, 'repairs_level'),
              confirmed_stains_level: getConfirmedValue(product, productModifications, 'stains_level'),
              confirmed_meets_minimum_requirements: getConfirmedValue(product, productModifications, 'meets_minimum_requirements')
            };

            // Preparar las reparaciones (separadas por ";")
            const repairFields = {
              tears_holes_repairs: productRepairData?.tears_holes_repairs?.join(';') || null,
              repairs_level_repairs: productRepairData?.repairs_level_repairs?.join(';') || null,
              stains_level_repairs: productRepairData?.stains_level_repairs?.join(';') || null
            };

            // Actualizar verificación del producto
            await updateProductVerification(product.id, {
              ...confirmedValues,
              ...repairFields,
              store_verified_by: 'sistema_tienda'
            });
          }
        }

        // Crear comentario en bitácora si hay modificaciones
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
      }

      // 2. Update the main trade-in request
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
