import { NextApiRequest, NextApiResponse } from 'next';
import { 
  updateProductVerification, 
  createTradeInComment, 
  updateTradeInStatus 
} from '@/app/lib/trade-in/sql-data';
import { evaluateProductCondition } from '@/app/lib/trade-in/product-condition-evaluator';

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
      verifiedBy
    } = req.body;

    // 1. Update each product with its confirmed states and repairs
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

      const repairFields = {
        tears_holes_repairs: productRepairData?.tears_holes_repairs?.join(';') || null,
        repairs_level_repairs: productRepairData?.repairs_level_repairs?.join(';') || null,
        stains_level_repairs: productRepairData?.stains_level_repairs?.join(';') || null
      };

      // Update the product
      await updateProductVerification(product.id, {
        ...confirmedValues,
        confirmed_calculated_state: confirmedCalculatedState,
        ...repairFields,
        store_verified_by: verifiedBy
      });
    }

    // 2. Generate a readable comment for the log
    if (modifiedConditions.length > 0) {
      const commentText = generateChangeComment(modifiedConditions, products);
      const contextData = {
        modified_conditions: modifiedConditions,
        products_affected: products.map(p => p.id),
        repair_selections: productRepairs
      };

      // Insert into the log
      await createTradeInComment(
        parseInt(id),
        'product_verification',
        commentText,
        contextData,
        verifiedBy
      );
    }

    // 3. Update the status of the trade-in request if necessary
    await updateTradeInStatus(parseInt(id), 'verificado_tienda');

    res.status(200).json({ 
      success: true, 
      message: 'Verificación guardada exitosamente',
      changes: modifiedConditions.length,
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

// Function to generate a readable comment for the log
function generateChangeComment(modifiedConditions, products) {
  const changeLines = modifiedConditions.map(mod => {
    const product = products.find(p => p.id === mod.productId);
    const productStyle = product?.product_style || 'Producto';

    // Map technical names to readable names
    const fieldNames = {
      'usage_signs': 'Señales de uso',
      'pilling_level': 'Nivel de pilling',
      'tears_holes_level': 'Nivel de rasgaduras y hoyos',
      'repairs_level': 'Nivel de reparaciones',
      'stains_level': 'Nivel de manchas',
      'meets_minimum_requirements': 'Cumple requisitos mínimos'
    };

    const fieldDisplayName = fieldNames[mod.questionId] || mod.questionId;
    
    return `${productStyle} - ${fieldDisplayName}: ${mod.originalValue} → ${mod.newValue}`;
  });

  const changeCount = modifiedConditions.length;
  const header = `Cambios Realizados (${changeCount})`;
  
  return `${header}\n${changeLines.join('\n')}`;
}
