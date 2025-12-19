import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';
import { 
  updateProductVerification, 
  createTradeInComment, 
  updateTradeInDeliveryMethod,
  updateTradeInVerificationStore
} from '@/app/lib/trade-in/sql-data';
import { evaluateProductCondition } from '@/app/lib/trade-in/product-condition-evaluator';

// Helper function to get credit from product master based on confirmed state
async function getCreditFromMaster(productStyle, confirmedState) {
  try {
    // Map confirmed state to condition_state codes
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

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      products,
      modifiedConditions,
      productRepairs,
      verifiedBy,
      deliveryMethod,
      storeCode,
      storeName
    } = req.body;

    // 0. Update delivery method if provided
    if (deliveryMethod) {
      await updateTradeInDeliveryMethod(parseInt(id), deliveryMethod);
    }

    // 0.1 Update verification store if provided
    if (storeCode) {
      await updateTradeInVerificationStore(parseInt(id), storeCode, storeName);
    }

    // Track state changes and credit changes
    const stateChanges = [];
    const creditChanges = [];

    // 1. Update each product with its confirmed states, repairs, and credit
    for (const product of products) {
      const productModifications = modifiedConditions.filter(mod => mod.productId === product.id);
      const productRepairData = productRepairs.find(pr => pr.productId === product.id);

      const confirmedValues = {
        confirmed_usage_signs: getConfirmedValue(product, productModifications, 'usage_signs'),
        confirmed_pilling_level: getConfirmedValue(product, productModifications, 'pilling_level'),
        confirmed_tears_holes_level: getConfirmedValue(product, productModifications, 'tears_holes_level'),
        confirmed_repairs_level: getConfirmedValue(product, productModifications, 'repairs_level'),
        confirmed_stains_level: getConfirmedValue(product, productModifications, 'stains_level'),
        confirmed_meets_minimum_requirements: getConfirmedValue(product, productModifications, 'meets_minimum_requirements')
      };

      // Calcular el estado confirmado usando la lógica de evaluación
      const conditionResponses = {
        usage_signs: confirmedValues.confirmed_usage_signs,
        pilling_level: confirmedValues.confirmed_pilling_level,
        tears_holes_level: confirmedValues.confirmed_tears_holes_level,
        repairs_level: confirmedValues.confirmed_repairs_level,
        stains_level: confirmedValues.confirmed_stains_level
      };

      const confirmedCalculatedState = evaluateProductCondition(conditionResponses);

      // Check if state changed
      if (product.calculated_state && confirmedCalculatedState && product.calculated_state !== confirmedCalculatedState) {
        stateChanges.push({
          productId: product.id,
          productStyle: product.product_style,
          productSize: product.product_size,
          originalState: product.calculated_state,
          confirmedState: confirmedCalculatedState
        });
      }

      // Calculate credit based on confirmed state
      let creditConfirmed = null;
      if (confirmedCalculatedState && product.product_style) {
        creditConfirmed = await getCreditFromMaster(product.product_style, confirmedCalculatedState);
        
        // Track credit change if different from original
        const originalCredit = product.credit_estimated || product.credit_confirmed;
        if (creditConfirmed !== originalCredit) {
          creditChanges.push({
            productId: product.id,
            productStyle: product.product_style,
            productSize: product.product_size,
            originalCredit: originalCredit,
            newCredit: creditConfirmed
          });
        }
      }

      const repairFields = {
        pilling_level_repairs: productRepairData?.pilling_level_repairs?.join(';') || null,
        tears_holes_repairs: productRepairData?.tears_holes_repairs?.join(';') || null,
        repairs_level_repairs: productRepairData?.repairs_level_repairs?.join(';') || null,
        stains_level_repairs: productRepairData?.stains_level_repairs?.join(';') || null
      };

      // Update the product with confirmed state and credit
      await updateProductVerification(product.id, {
        ...confirmedValues,
        confirmed_calculated_state: confirmedCalculatedState,
        credit_confirmed: creditConfirmed,
        ...repairFields,
        store_verified_by: verifiedBy
      });
    }

    // 2. Generate a readable comment for the log (only if there are changes)
    const totalChanges = modifiedConditions.length + stateChanges.length + creditChanges.length;
    if (totalChanges > 0) {
      const commentText = generateChangeComment(modifiedConditions, stateChanges, creditChanges, products);
      const contextData = {
        modified_conditions: modifiedConditions,
        state_changes: stateChanges,
        credit_changes: creditChanges,
        products_affected: products.map(p => p.id),
        repair_selections: productRepairs
      };

      // Insert into the log
      await createTradeInComment(
        parseInt(id),
        'product_verification_saved',
        commentText,
        contextData,
        verifiedBy
      );
    }

    // Note: We do NOT change the status here - just save verification data
    // Status changes happen when confirming reception (Confirmar Recepción button)

    res.status(200).json({ 
      success: true, 
      message: 'Verificación guardada exitosamente',
      changes: totalChanges,
      products: products.length
    });

  } catch (error) {
    console.error('Error saving store verification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al guardar la verificación', 
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

// Aux function to get the confirmed value (modified or original)
function getConfirmedValue(product, modifications, fieldName) {
  const modification = modifications.find(mod => mod.questionId === fieldName);
  if (modification) {
    // Para campos booleanos, convertir string a boolean
    if (fieldName === 'meets_minimum_requirements') {
      return modification.newValue === 'true' || modification.newValue === true;
    }
    return modification.newValue;
  }
  return product[fieldName];
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

// Function to generate a readable comment for the log
function generateChangeComment(modifiedConditions, stateChanges, creditChanges, products) {
  const lines = [];
  
  // Map technical names to readable names
  const fieldNames = {
    'usage_signs': 'Señales de uso',
    'pilling_level': 'Nivel de pilling',
    'tears_holes_level': 'Nivel de rasgaduras y hoyos',
    'repairs_level': 'Nivel de reparaciones',
    'stains_level': 'Nivel de manchas',
    'meets_minimum_requirements': 'Cumple requisitos mínimos'
  };

  // Add condition modifications
  modifiedConditions.forEach(mod => {
    const product = products.find(p => p.id === mod.productId);
    const productStyle = product?.product_style || 'Producto';
    const fieldDisplayName = fieldNames[mod.questionId] || mod.questionId;
    const originalFormatted = formatReadableValue(mod.questionId, mod.originalValue);
    const newFormatted = formatReadableValue(mod.questionId, mod.newValue);
    
    lines.push(`${productStyle} - ${fieldDisplayName}: ${originalFormatted} → ${newFormatted}`);
  });

  // Add state changes
  stateChanges.forEach(change => {
    lines.push(`${change.productStyle} - Estado: ${change.originalState} → ${change.confirmedState}`);
  });

  // Add credit changes
  creditChanges.forEach(change => {
    const originalCredit = change.originalCredit ? `$${change.originalCredit.toLocaleString('es-CL')}` : 'Sin crédito';
    const newCredit = change.newCredit ? `$${change.newCredit.toLocaleString('es-CL')}` : 'Sin crédito';
    lines.push(`${change.productStyle} - Crédito: ${originalCredit} → ${newCredit}`);
  });

  const totalChanges = modifiedConditions.length + stateChanges.length + creditChanges.length;
  const header = `Cambios en tienda guardados (${totalChanges}):`;
  
  return `${header}\n${lines.join('\n')}`;
}
