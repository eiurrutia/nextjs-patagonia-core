// Product condition evaluation logic for trade-in products
// Determines final product state based on condition question responses

export interface ConditionResponses {
  usage_signs: 'yes' | 'no';
  pilling_level: 'no_presenta' | 'moderate' | 'high';
  stains_level: 'no_presenta' | 'moderate' | 'high';
  tears_holes_level: 'no_presenta' | 'moderate' | 'high';
  repairs_level: 'no_presenta' | 'moderate' | 'high';
}

export type ProductState = 'Como Nuevo' | 'Con detalles de uso' | 'Reparado' | 'Reciclado';

// Mapping from response values to scoring system
const responseToScore = {
  'no_presenta': 0,    // B (antes 'regular')
  'moderate': 1,       // M  
  'high': 3            // A
};

// Mapping from response values to letter grades for readability
const responseToGrade = {
  'no_presenta': 'B',
  'moderate': 'M',
  'high': 'A'
};

/**
 * Evaluates product condition and returns the appropriate state
 * @param responses - Object containing responses to all condition questions
 * @returns ProductState - The determined state of the product
 */
export function evaluateProductCondition(responses: ConditionResponses): ProductState {
  const { usage_signs, pilling_level, stains_level, tears_holes_level, repairs_level } = responses;

  // Special case: If usage_signs is "no" (no signs of use)
  // Product can only be "Como Nuevo" if ALL other responses are also "no_presenta"
  if (usage_signs === 'no') {
    if (pilling_level === 'no_presenta' && 
        stains_level === 'no_presenta' &&
        tears_holes_level === 'no_presenta' && 
        repairs_level === 'no_presenta') {
      return 'Como Nuevo';
    }
    // If usage_signs is no but others are not all no_presenta, continue with scoring logic
  }

  // For all other cases (usage_signs is yes, or usage_signs is no but others aren't all no_presenta)
  // Use scoring table logic
  
  // Calculate scores for the four evaluation criteria (excluding usage_signs)
  const pillingScore = responseToScore[pilling_level];
  const stainsScore = responseToScore[stains_level];
  const tearsScore = responseToScore[tears_holes_level];
  const repairsScore = responseToScore[repairs_level];
  
  // Count number of repairs (non-no_presenta responses)
  const numRepairs = [pilling_level, stains_level, tears_holes_level, repairs_level]
    .filter(response => response !== 'no_presenta').length;
  
  // Calculate total score
  const totalScore = pillingScore + stainsScore + tearsScore + repairsScore;

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
  const { usage_signs, pilling_level, stains_level, tears_holes_level, repairs_level } = responses;
  
  const pillingGrade = responseToGrade[pilling_level];
  const stainsGrade = responseToGrade[stains_level];
  const tearsGrade = responseToGrade[tears_holes_level];
  const repairsGrade = responseToGrade[repairs_level];
  
  const pillingScore = responseToScore[pilling_level];
  const stainsScore = responseToScore[stains_level];
  const tearsScore = responseToScore[tears_holes_level];
  const repairsScore = responseToScore[repairs_level];
  
  const numRepairs = [pilling_level, stains_level, tears_holes_level, repairs_level]
    .filter(response => response !== 'no_presenta').length;
  
  const totalScore = pillingScore + stainsScore + tearsScore + repairsScore;
  const finalState = evaluateProductCondition(responses);

  return {
    usageSignsValue: usage_signs,
    pillingGrade,
    stainsGrade,
    tearsGrade,
    repairsGrade,
    pillingScore,
    stainsScore,
    tearsScore,
    repairsScore,
    numRepairs,
    totalScore,
    finalState,
    isSpecialCase: usage_signs === 'no' && 
                   pilling_level === 'no_presenta' && 
                   stains_level === 'no_presenta' &&
                   tears_holes_level === 'no_presenta' && 
                   repairs_level === 'no_presenta'
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
    responses.stains_level &&
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
