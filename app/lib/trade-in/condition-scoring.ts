// Condition scoring system for store reception
// This system calculates product condition levels based on selected repair options

export interface RepairOption {
  id: string;
  label: string;
  category: string;
  score: number; // Puntaje que otorga este selector
}

export interface RepairCategory {
  questionId: string;
  question: string;
  options: RepairOption[];
}

// Pilling options (nuevo - ahora tiene selectores)
export const pillingRepairOptions: RepairOption[] = [
  {
    id: 'pilling_moderado',
    label: 'Presenta pilling moderado',
    category: 'pilling',
    score: 1
  },
  {
    id: 'pilling_bastante',
    label: 'Presenta bastante pilling',
    category: 'pilling',
    score: 3
  }
];

// Tears and holes repair options
// No presenta: 0, Moderado: 1-2, Alto: >=3
export const tearsHolesRepairOptions: RepairOption[] = [
  { id: 'costura_pequena', label: 'Costura pequeña (0 a 5 cm)', category: 'costura', score: 1 },
  { id: 'costura_mediana', label: 'Costura mediana (5 a 15 cm)', category: 'costura', score: 1 },
  { id: 'costura_grande', label: 'Costura grande (+15 cm)', category: 'costura', score: 3 },
  { id: 'parche_pequeno', label: 'Parche pequeño (0 a 5 cm)', category: 'parche', score: 3 },
  { id: 'parche_mediano', label: 'Parche mediano (5 a 15 cm)', category: 'parche', score: 3 },
  { id: 'parche_grande', label: 'Parche grande (+15 cm)', category: 'parche', score: 3 },
  { id: 'parche_tenasius', label: 'Poner parche tenasius', category: 'parche', score: 3 }
];

// Repairs level options
// No presenta: 0, Moderado: 1-2, Alto: >=3
export const repairsLevelOptions: RepairOption[] = [
  { id: 'ajuste_elastico', label: 'Ajuste de elástico', category: 'ajuste', score: 1 },
  { id: 'cambio_carro', label: 'Cambio de carro', category: 'cambio', score: 1 },
  { id: 'cambio_broche', label: 'Cambio de Broche', category: 'cambio', score: 1 },
  { id: 'cambio_boton', label: 'Cambio de botón', category: 'cambio', score: 1 },
  { id: 'cambio_velcro', label: 'Cambio de velcro', category: 'cambio', score: 1 },
  { id: 'ruedo_terminacion', label: 'Ruedo/Terminación costura', category: 'terminacion', score: 1 },
  { id: 'cambio_cierre_mochila', label: 'Cambio cierre mochila', category: 'cierre', score: 3 },
  { id: 'cambio_cierres_cortos', label: 'Cambio cierres cortos (0 a 30cm)', category: 'cierre', score: 3 },
  { id: 'cambio_cierre_frontal_medio', label: 'Cambio cierre frontal (30 cm a 90 cm)', category: 'cierre', score: 3 },
  { id: 'cambio_cierre_frontal_grande', label: 'Cambio cierre frontal (+ 90cm)', category: 'cierre', score: 3 },
  { id: 'cambio_panel', label: 'Cambio de panel', category: 'cambio', score: 3 }
];

// Stains level options
// No presenta: 0, Moderado: 1-2, Alto: >=3
export const stainsLevelOptions: RepairOption[] = [
  { id: 'lavado_normal', label: 'Sale con el lavado (polvo, maquillaje, etc)', category: 'lavado', score: 1 },
  { id: 'necesita_lavado_olor', label: 'Necesita lavado porque está con mal olor', category: 'lavado', score: 1 },
  { id: 'mancha_pequena', label: 'No sale con el lavado <2cm', category: 'mancha', score: 3 },
  { id: 'mancha_mediana', label: 'No sale con el lavado. 2cm < mancha < 5cm', category: 'mancha', score: 3 }
];

// Type for condition level
export type ConditionLevel = 'no_presenta' | 'moderate' | 'high';

/**
 * Calculate the condition level based on selected repair options
 * @param selectedRepairIds - Array of selected repair option IDs
 * @param repairOptions - Available repair options for the question
 * @returns The calculated condition level
 */
export function calculateConditionLevel(
  selectedRepairIds: string[],
  repairOptions: RepairOption[]
): ConditionLevel {
  if (selectedRepairIds.length === 0) {
    return 'no_presenta';
  }

  // Calculate total score
  const totalScore = selectedRepairIds.reduce((sum, repairId) => {
    const option = repairOptions.find(opt => opt.id === repairId);
    return sum + (option?.score || 0);
  }, 0);

  // Determine level based on score thresholds
  if (totalScore === 0) {
    return 'no_presenta';
  } else if (totalScore >= 1 && totalScore <= 2) {
    return 'moderate';
  } else {
    return 'high';
  }
}

/**
 * Get repair options for a specific question
 * @param questionId - The ID of the condition question
 * @returns Array of repair options for that question
 */
export function getRepairOptionsForQuestion(questionId: string): RepairOption[] {
  switch (questionId) {
    case 'pilling_level':
      return pillingRepairOptions;
    case 'tears_holes_level':
      return tearsHolesRepairOptions;
    case 'repairs_level':
      return repairsLevelOptions;
    case 'stains_level':
      return stainsLevelOptions;
    default:
      return [];
  }
}

/**
 * Get all repair categories with their options
 */
export const repairCategories: RepairCategory[] = [
  {
    questionId: 'pilling_level',
    question: 'Nivel de pilling',
    options: pillingRepairOptions
  },
  {
    questionId: 'tears_holes_level',
    question: 'Rasgaduras y hoyos',
    options: tearsHolesRepairOptions
  },
  {
    questionId: 'repairs_level',
    question: 'Nivel de reparación',
    options: repairsLevelOptions
  },
  {
    questionId: 'stains_level',
    question: 'Manchas o mal olor',
    options: stainsLevelOptions
  }
];
