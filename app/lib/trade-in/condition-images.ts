// Condition assessment images for trade-in products
// These images help customers understand the different levels of wear

export interface ConditionOption {
  value: string;
  label: string;
  description: string;
  imageUrl: string;
}

export interface ConditionQuestion {
  id: string;
  question: string;
  description: string;
  options: ConditionOption[];
}

export const conditionQuestions: ConditionQuestion[] = [
  {
    id: 'usage_signs',
    question: '¿Señales de uso?',
    description: 'Evalúa las señales generales de uso del producto',
    options: [
      {
        value: 'practically_none',
        label: 'Prácticamente nada',
        description: 'El producto se ve como nuevo, sin señales visibles de uso',
        imageUrl: '/images/trade-in/usage-signs-none.png'
      },
      {
        value: 'somewhat_noticeable',
        label: 'Un poco notorio',
        description: 'Señales leves de uso, pero el producto está en muy buen estado',
        imageUrl: '/images/trade-in/usage-signs-light.png'
      },
      {
        value: 'quite_noticeable',
        label: 'Bastante notorio',
        description: 'Señales evidentes de uso, pero el producto aún es funcional',
        imageUrl: '/images/trade-in/usage-signs-heavy.png'
      }
    ]
  },
  {
    id: 'pilling_level',
    question: 'Nivel de pilling',
    description: 'Evalúa la presencia de bolitas o pilling en el tejido',
    options: [
      {
        value: 'practically_none',
        label: 'Prácticamente nada',
        description: 'Sin pilling visible, tejido liso y uniforme',
        imageUrl: '/images/trade-in/pilling-none.png'
      },
      {
        value: 'somewhat_noticeable',
        label: 'Un poco notorio',
        description: 'Pilling leve en algunas áreas, principalmente en zonas de roce',
        imageUrl: '/images/trade-in/pilling-light.png'
      },
      {
        value: 'quite_noticeable',
        label: 'Bastante notorio',
        description: 'Pilling evidente en múltiples áreas del producto',
        imageUrl: '/images/trade-in/pilling-heavy.png'
      }
    ]
  },
  {
    id: 'tears_holes_level',
    question: 'Nivel de rasgaduras y hoyos',
    description: 'Evalúa la presencia de rasgaduras, hoyos o daños en el tejido',
    options: [
      {
        value: 'practically_none',
        label: 'Prácticamente nada',
        description: 'Sin rasgaduras ni hoyos visibles',
        imageUrl: '/images/trade-in/tears-none.png'
      },
      {
        value: 'somewhat_noticeable',
        label: 'Un poco notorio',
        description: 'Pequeñas rasgaduras o hoyos menores que no afectan la funcionalidad',
        imageUrl: '/images/trade-in/tears-light.png'
      },
      {
        value: 'quite_noticeable',
        label: 'Bastante notorio',
        description: 'Rasgaduras o hoyos evidentes que pueden afectar el uso',
        imageUrl: '/images/trade-in/tears-heavy.png'
      }
    ]
  },
  {
    id: 'repairs_level',
    question: 'Nivel de reparaciones',
    description: 'Evalúa si el producto tiene reparaciones visibles',
    options: [
      {
        value: 'practically_none',
        label: 'Prácticamente nada',
        description: 'Sin reparaciones visibles, producto original',
        imageUrl: '/images/trade-in/repairs-none.png'
      },
      {
        value: 'somewhat_noticeable',
        label: 'Un poco notorio',
        description: 'Reparaciones menores bien ejecutadas',
        imageUrl: '/images/trade-in/repairs-light.png'
      },
      {
        value: 'quite_noticeable',
        label: 'Bastante notorio',
        description: 'Reparaciones evidentes o múltiples reparaciones',
        imageUrl: '/images/trade-in/repairs-heavy.png'
      }
    ]
  }
];

// Helper function to get condition question by ID
export function getConditionQuestion(id: string): ConditionQuestion | undefined {
  return conditionQuestions.find(q => q.id === id);
}

// Helper function to get condition option label
export function getConditionOptionLabel(questionId: string, value: string): string {
  const question = getConditionQuestion(questionId);
  const option = question?.options.find(opt => opt.value === value);
  return option?.label || value;
}
