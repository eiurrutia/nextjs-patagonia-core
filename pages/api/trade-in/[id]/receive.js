import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { sql } from '@vercel/postgres';
import { updateProductVerification, createTradeInComment, updateProductsStatusToEnTienda } from '@/app/lib/trade-in/sql-data';
import { evaluateProductCondition } from '@/app/lib/trade-in/product-condition-evaluator';

// Helper function to get credit from product master based on confirmed state
async function getCreditFromMaster(productStyle, confirmedState) {
  try {
    // Map confirmed state to condition_state codes using the same logic as credit-utils.ts
    // 'Como Nuevo' -> 'CN'
    // 'Con detalles de uso' -> 'DU'  
    // 'Reparado' -> 'RP'
    // 'Reciclado' -> null (no credit)
    let conditionStateCode = null;
    if (confirmedState === 'Como Nuevo') {
      conditionStateCode = 'CN';
    } else if (confirmedState === 'Con detalles de uso') {
      conditionStateCode = 'DU';
    } else if (confirmedState === 'Reparado') {
      conditionStateCode = 'RP';
    } else if (confirmedState === 'Reciclado') {
      // No credit for recycled items
      return null;
    }
    
    if (!conditionStateCode) {
      console.log(`No condition state code found for: ${confirmedState}`);
      return null;
    }
    
    // Extract style code (before the dash)
    const dashIndex = productStyle.indexOf('-');
    const styleCode = dashIndex === -1 ? productStyle.trim() : productStyle.substring(0, dashIndex).trim();
    
    const result = await sql`
      SELECT credit_amount as credit_confirmed
      FROM trade_in_product_master
      WHERE style_code = ${styleCode}
        AND condition_state = ${conditionStateCode}
      LIMIT 1
    `;
    
    return result.rows[0]?.credit_confirmed || null;
  } catch (error) {
    console.error('Error fetching credit from master:', error);
    return null;
  }
}

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

// Function to calculate process based on confirmed conditions
function calculateProcess(confirmedCalculatedState, confirmedValues) {
  // If state is "Reciclado" (IN - Invendible), always return "IN"
  if (confirmedCalculatedState === 'Reciclado') {
    return 'IN';
  }

  const pilling = confirmedValues.confirmed_pilling_level;
  const tearsHoles = confirmedValues.confirmed_tears_holes_level;
  const repairs = confirmedValues.confirmed_repairs_level;
  const stains = confirmedValues.confirmed_stains_level;

  // Check if there's physical damage (Moderado or Alto in Pilling, Rasgaduras, or Reparaciones)
  const hasPhysicalDamage = 
    pilling === 'moderate' || pilling === 'high' ||
    tearsHoles === 'moderate' || tearsHoles === 'high' ||
    repairs === 'moderate' || repairs === 'high';

  // Check if there are stains (Moderado or Alto)
  const hasStains = stains === 'moderate' || stains === 'high';

  // Apply the logic from Excel formula
  if (hasPhysicalDamage && hasStains) {
    return 'LAV-REP'; // Needs washing and repair
  } else if (hasPhysicalDamage) {
    return 'REP'; // Only needs repair
  } else if (hasStains) {
    return 'LAV'; // Only needs washing
  } else {
    return 'ETI'; // Only needs labeling (etiquetado)
  }
}

// Helper to format readable values
function formatReadableValue(fieldName, value) {
  // Map for usage_signs (yes/no)
  if (fieldName === 'usage_signs') {
    if (value === 'yes' || value === true) return 'Sí';
    if (value === 'no' || value === false) return 'No';
    return value;
  }
  
  // Map for levels
  const levelLabels = {
    'no_presenta': 'No Presenta',
    'none': 'No Presenta',
    'low': 'Bajo',
    'moderate': 'Moderado',
    'high': 'Alto'
  };
  
  return levelLabels[value] || value;
}

// Aux function to generate change comment
function generateChangeComment(modifiedConditions, products) {
  const conditionLabels = {
    'usage_signs': 'Señales de uso',
    'pilling_level': 'Nivel de pilling',
    'tears_holes_level': 'Nivel de rasgaduras y hoyos',
    'repairs_level': 'Nivel de reparaciones',
    'stains_level': 'Nivel de manchas',
    'meets_minimum_requirements': 'Cumple requisitos mínimos'
  };

  const changes = modifiedConditions.map(mod => {
    const product = products.find(p => p.id == mod.productId);
    const productStyle = product?.product_style || `Producto ${mod.productId}`;
    const conditionLabel = conditionLabels[mod.questionId] || mod.questionId;
    const originalFormatted = formatReadableValue(mod.questionId, mod.originalValue);
    const newFormatted = formatReadableValue(mod.questionId, mod.newValue);
    
    return `${productStyle} - ${conditionLabel}: ${originalFormatted} → ${newFormatted}`;
  });
  
  return `Verificación en tienda realizada. Cambios (${modifiedConditions.length}):\n${changes.join('\n')}`;
}

// Aux function to generate state change comment
function generateStateChangeComment(stateChanges, products, creditChanges = []) {
  const lines = [];
  
  // Add state changes
  stateChanges.forEach(change => {
    const product = products.find(p => p.id == change.productId);
    const productStyle = product?.product_style || `Producto ${change.productId}`;
    lines.push(`${productStyle} - Estado: ${change.originalState} → ${change.confirmedState}`);
  });

  // Add credit changes if provided
  creditChanges.forEach(change => {
    const originalCredit = change.originalCredit ? `$${Number(change.originalCredit).toLocaleString('es-CL')}` : 'Sin crédito';
    const newCredit = change.newCredit ? `$${Number(change.newCredit).toLocaleString('es-CL')}` : 'Sin crédito';
    lines.push(`${change.productStyle} - Crédito: ${originalCredit} → ${newCredit}`);
  });
  
  const totalChanges = stateChanges.length + creditChanges.length;
  return `Estados de productos actualizados (${totalChanges}):\n${lines.join('\n')}`;
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
      receivedStoreCode,
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
      // Arrays to track changes
      const stateChanges = [];
      const creditChanges = [];
      
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

        // Get confirmed credit from product master based on confirmed state
        let creditConfirmed = null;
        if (confirmedCalculatedState && product.product_style) {
          creditConfirmed = await getCreditFromMaster(product.product_style, confirmedCalculatedState);
          console.log(`Product ${product.id} - Confirmed State: ${confirmedCalculatedState}, Credit: ${creditConfirmed}`);
        }

        // Calculate process based on confirmed state and conditions
        const process = calculateProcess(confirmedCalculatedState, confirmedValues);
        console.log(`Product ${product.id} - Process: ${process}`);

        // Check if calculated state changed
        if (product.calculated_state && confirmedCalculatedState && product.calculated_state !== confirmedCalculatedState) {
          stateChanges.push({
            productId: product.id,
            productStyle: product.product_style,
            originalState: product.calculated_state,
            confirmedState: confirmedCalculatedState
          });
        }

        // Track credit change if different from original
        const originalCredit = product.credit_estimated || product.credit_confirmed;
        if (creditConfirmed !== originalCredit && (creditConfirmed || originalCredit)) {
          creditChanges.push({
            productId: product.id,
            productStyle: product.product_style,
            originalCredit: originalCredit,
            newCredit: creditConfirmed
          });
        }

        // Prepare repairs (separated by ";")
        const repairFields = {
          tears_holes_repairs: productRepairData?.tears_holes_repairs?.join(';') || null,
          repairs_level_repairs: productRepairData?.repairs_level_repairs?.join(';') || null,
          stains_level_repairs: productRepairData?.stains_level_repairs?.join(';') || null
        };

        const verificationData = {
          ...confirmedValues,
          confirmed_calculated_state: confirmedCalculatedState,
          credit_confirmed: creditConfirmed,
          process: process,
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

      // 2. Create log comment for condition modifications
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

      // 3. Create log comment for state changes and credit changes
      if (stateChanges.length > 0 || creditChanges.length > 0) {
        const stateCommentText = generateStateChangeComment(stateChanges, existingProducts.rows, creditChanges);
        const stateContextData = {
          state_changes: stateChanges,
          credit_changes: creditChanges,
          products_affected: [...new Set([...stateChanges.map(sc => sc.productId), ...creditChanges.map(cc => cc.productId)])]
        };

        await createTradeInComment(
          requestId,
          'state_change',
          stateCommentText,
          stateContextData,
          'sistema_tienda'
        );
      }

      // 4. Update the main trade-in request
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
          received_store_code = ${receivedStoreCode || null},
          status = ${status || 'recepcionado_tienda'},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${requestId}
      `;

      // 5. Update products status to "en_tienda" when received in store
      await updateProductsStatusToEnTienda(requestId);

      // 6. Update products with received store code
      if (receivedStoreCode) {
        await sql`
          UPDATE trade_in_products 
          SET 
            received_store_code = ${receivedStoreCode},
            updated_at = CURRENT_TIMESTAMP
          WHERE request_id = ${requestId}
        `;
      }

      // 7. Update existing products with any new information if provided
      if (products && products.length > 0) {
        for (const product of products) {
          // Only update if the product exists and has changes
          const existingProduct = existingProducts.rows.find(ep => ep.product_style === product.product_style && ep.product_size === product.product_size);
          if (existingProduct) {
            await sql`
              UPDATE trade_in_products 
              SET 
                credit_estimated = ${product.credit_estimated || existingProduct.credit_estimated},
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
