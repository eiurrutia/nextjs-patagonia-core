// Product condition evaluation logic for trade-in products
// Determines final product state based on condition question responses

export interface ConditionResponses {
  usage_signs: 'practically_none' | 'somewhat_noticeable' | 'quite_noticeable';
  pilling_level: 'practically_none' | 'somewhat_noticeable' | 'quite_noticeable';
  tears_holes_level: 'practically_none' | 'somewhat_noticeable' | 'quite_noticeable';
  repairs_level: 'practically_none' | 'somewhat_noticeable' | 'quite_noticeable';
}

export type ProductState = 'Como Nuevo' | 'Con detalles de uso' | 'Reparado' | 'Reciclado';

// Mapping from response values to scoring system
const responseToScore = {
  'practically_none': 0,    // B
  'somewhat_noticeable': 1, // M  
  'quite_noticeable': 3     // A
};

// Mapping from response values to letter grades for readability
const responseToGrade = {
  'practically_none': 'B',
  'somewhat_noticeable': 'M',
  'quite_noticeable': 'A'
};

/**
 * Evaluates product condition and returns the appropriate state
 * @param responses - Object containing responses to all condition questions
 * @returns ProductState - The determined state of the product
 */
export function evaluateProductCondition(responses: ConditionResponses): ProductState {
  const { usage_signs, pilling_level, tears_holes_level, repairs_level } = responses;

  // Special case: If usage_signs is "practically_none" (B)
  // Product can only be "Como Nuevo" if ALL other responses are also "practically_none" (B)
  if (usage_signs === 'practically_none') {
    if (pilling_level === 'practically_none' && 
        tears_holes_level === 'practically_none' && 
        repairs_level === 'practically_none') {
      return 'Como Nuevo';
    }
    // If usage_signs is B but others are not all B, continue with scoring logic
  }

  // For all other cases (usage_signs is M or A, or usage_signs is B but others aren't all B)
  // Use scoring table logic
  
  // Calculate scores for the three evaluation criteria (excluding usage_signs)
  const pillingScore = responseToScore[pilling_level];
  const tearsScore = responseToScore[tears_holes_level];
  const repairsScore = responseToScore[repairs_level];
  
  // Count number of repairs (non-B responses)
  const numRepairs = [pilling_level, tears_holes_level, repairs_level]
    .filter(response => response !== 'practically_none').length;
  
  // Calculate total score
  const totalScore = pillingScore + tearsScore + repairsScore;

  // Determine state based on scoring table
  if (totalScore === 0 && numRepairs === 0) {
    return 'Como Nuevo';
  } else if (totalScore <= 2 && numRepairs <= 2) {
    return 'Con detalles de uso';
  } else if (totalScore <= 4 && numRepairs <= 3) {
    return 'Reparado';
  } else {
    return 'Reciclado';
  }
}

/**
 * Helper function to get detailed evaluation breakdown for debugging/display
 * @param responses - Object containing responses to all condition questions
 * @returns Object with evaluation details
 */
export function getEvaluationBreakdown(responses: ConditionResponses) {
  const { usage_signs, pilling_level, tears_holes_level, repairs_level } = responses;
  
  const pillingGrade = responseToGrade[pilling_level];
  const tearsGrade = responseToGrade[tears_holes_level];
  const repairsGrade = responseToGrade[repairs_level];
  
  const pillingScore = responseToScore[pilling_level];
  const tearsScore = responseToScore[tears_holes_level];
  const repairsScore = responseToScore[repairs_level];
  
  const numRepairs = [pilling_level, tears_holes_level, repairs_level]
    .filter(response => response !== 'practically_none').length;
  
  const totalScore = pillingScore + tearsScore + repairsScore;
  const finalState = evaluateProductCondition(responses);

  return {
    usageSignsGrade: responseToGrade[usage_signs],
    pillingGrade,
    tearsGrade,
    repairsGrade,
    pillingScore,
    tearsScore,
    repairsScore,
    numRepairs,
    totalScore,
    finalState,
    isSpecialCase: usage_signs === 'practically_none' && 
                   pilling_level === 'practically_none' && 
                   tears_holes_level === 'practically_none' && 
                   repairs_level === 'practically_none'
  };
}

/**
 * Validates that all required condition responses are provided
 * @param responses - Partial condition responses
 * @returns boolean indicating if all responses are complete
 */
export function areConditionResponsesComplete(responses: Partial<ConditionResponses>): responses is ConditionResponses {
  return !!(
    responses.usage_signs &&
    responses.pilling_level &&
    responses.tears_holes_level &&
    responses.repairs_level
  );
}

/**
 * Helper function to convert product state to a color for UI display
 * @param state - The product state
 * @returns Object with color classes for different UI frameworks
 */
export function getStateDisplayColors(state: ProductState) {
  switch (state) {
    case 'Como Nuevo':
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200'
      };
    case 'Con detalles de uso':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-200'
      };
    case 'Reparado':
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        border: 'border-orange-200'
      };
    case 'Reciclado':
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200'
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-200'
      };
  }
}
