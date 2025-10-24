'use client';

import { ProductState } from './product-condition-evaluator';

// Format credit amount to Chilean peso format
export function formatChileanPesos(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Extract style code from product style input (before the dash or entire string if no dash)
export function extractStyleCode(productStyle: string): string {
  if (!productStyle) return '';
  
  // Find the first dash and take everything before it
  const dashIndex = productStyle.indexOf('-');
  if (dashIndex === -1) {
    // No dash found, return the entire string
    return productStyle.trim();
  }
  
  return productStyle.substring(0, dashIndex).trim();
}

// Interface for credit data from server
interface ProductCredit {
  condition_state: 'CN' | 'DU' | 'RP';
  credit_amount: number;
  product_name: string;
}

interface CreditRange {
  minCredit: number;
  maxCredit: number;
  productName: string;
  credits: ProductCredit[];
}

// Calculate credit range message based on calculated state
export function calculateCreditMessage(
  creditData: CreditRange,
  calculatedState: ProductState | null
): string {
  if (!calculatedState) {
    return '';
  }

  // Handle special "Reciclado" state
  if (calculatedState === 'Reciclado') {
    return 'Lo siento, el estado de tu producto no accede a crédito. Pero no te preocupes! Puedes enviarlo igual y nosotros nos encargamos de reciclarlo y así cuidar nuestro planeta.';
  }

  // Find credits for the calculated state and lower states
  const stateOrder = ['RP', 'DU', 'CN']; // From lowest to highest
  const currentStateIndex = stateOrder.indexOf(calculatedState === 'Como Nuevo' ? 'CN' : 
                                              calculatedState === 'Con detalles de uso' ? 'DU' : 'RP');
  
  if (currentStateIndex === -1) {
    return '';
  }

  // Get credits for current state and all lower states
  const relevantCredits = creditData.credits.filter(credit => {
    const creditStateIndex = stateOrder.indexOf(credit.condition_state);
    return creditStateIndex <= currentStateIndex;
  });

  if (relevantCredits.length === 0) {
    return '';
  }

  const minCredit = Math.min(...relevantCredits.map(c => c.credit_amount));
  const maxCredit = Math.max(...relevantCredits.map(c => c.credit_amount));

  // If only one credit level or min equals max
  if (relevantCredits.length === 1 || minCredit === maxCredit) {
    return `Crédito estimado para este trade-in: ${formatChileanPesos(maxCredit)}`;
  }

  // Return range
  return `Crédito estimado para este trade-in: ${formatChileanPesos(minCredit)} - ${formatChileanPesos(maxCredit)}`;
}

// Get credit for specific state
export function getCreditForState(
  creditData: CreditRange,
  state: 'CN' | 'DU' | 'RP'
): number | null {
  const credit = creditData.credits.find(c => c.condition_state === state);
  return credit ? credit.credit_amount : null;
}

// Map ProductState to database condition state
export function mapProductStateToCondition(state: ProductState): 'CN' | 'DU' | 'RP' | null {
  switch (state) {
    case 'Como Nuevo':
      return 'CN';
    case 'Con detalles de uso':
      return 'DU';
    case 'Reparado':
      return 'RP';
    case 'Reciclado':
      return null; // No credit for recycled items
    default:
      return null;
  }
}