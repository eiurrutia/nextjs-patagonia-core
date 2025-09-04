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

// Get base URL for images (Vercel Blob storage)
const getImageUrl = (filename: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_IMAGES_BASE_URL || '/images/trade-in';
  return `${baseUrl}/trade-in-images/${filename}`;
};

export const conditionQuestions: ConditionQuestion[] = [
  {
    id: 'usage_signs',
    question: 'Señales de uso',
    description: '¿Hay alguna imperfección visual o señal de uso en tu producto, como manchas, descoceduras, reparaciones o apelmazamientos?*',
    options: [
      {
        value: 'yes',
        label: 'Sí',
        description: 'Producto presenta señales de uso',
        imageUrl: getImageUrl('usage-signs-yes.png')
      },
      {
        value: 'no',
        label: 'No',
        description: 'Producto no presenta señales de uso significativas',
        imageUrl: getImageUrl('usage-signs-no.png')
      }
    ]
  },
  {
    id: 'pilling_level',
    question: 'Nivel de pilling',
    description: 'Evalúa la presencia de bolitas o pilling en el tejido',
    options: [
      {
        value: 'regular',
        label: 'Regular',
        description: 'Sin pilling visible, tejido liso y uniforme',
        imageUrl: getImageUrl('pilling-none.png')
      },
      {
        value: 'moderate',
        label: 'Moderado',
        description: 'Pilling leve en algunas áreas, principalmente en zonas de roce',
        imageUrl: getImageUrl('pilling-light.png')
      },
      {
        value: 'high',
        label: 'Alto',
        description: 'Pilling evidente en múltiples áreas del producto',
        imageUrl: getImageUrl('pilling-heavy.png')
      }
    ]
  },
  {
    id: 'tears_holes_level',
    question: 'Nivel de rasgaduras y hoyos',
    description: 'Evalúa la presencia de rasgaduras, hoyos o daños en el tejido',
    options: [
      {
        value: 'regular',
        label: 'Regular',
        description: 'Sin rasgaduras ni hoyos visibles',
        imageUrl: getImageUrl('tears-none.png')
      },
      {
        value: 'moderate',
        label: 'Moderado',
        description: 'Pequeñas rasgaduras o hoyos menores que no afectan la funcionalidad',
        imageUrl: getImageUrl('tears-light.png')
      },
      {
        value: 'high',
        label: 'Alto',
        description: 'Rasgaduras o hoyos evidentes que pueden afectar el uso',
        imageUrl: getImageUrl('tears-heavy.png')
      }
    ]
  },
  {
    id: 'repairs_level',
    question: 'Nivel de reparaciones',
    description: 'Evalúa si el producto tiene reparaciones visibles',
    options: [
      {
        value: 'regular',
        label: 'Regular',
        description: 'Sin reparaciones visibles, producto original',
        imageUrl: getImageUrl('repairs-none.png')
      },
      {
        value: 'moderate',
        label: 'Moderado',
        description: 'Reparaciones menores bien ejecutadas',
        imageUrl: getImageUrl('repairs-light.png')
      },
      {
        value: 'high',
        label: 'Alto',
        description: 'Reparaciones evidentes o múltiples reparaciones',
        imageUrl: getImageUrl('repairs-heavy.png')
      }
    ]
  },
  {
    id: 'stains_level',
    question: 'Nivel de manchas',
    description: 'Evalúa si el producto tiene manchas visibles',
    options: [
      {
        value: 'regular',
        label: 'Regular',
        description: 'Sin manchas visibles, tela limpia',
        imageUrl: getImageUrl('stains-none.png')
      },
      {
        value: 'moderate',
        label: 'Moderado',
        description: 'Manchas leves o poco notorias',
        imageUrl: getImageUrl('stains-light.png')
      },
      {
        value: 'high',
        label: 'Alto',
        description: 'Manchas evidentes o múltiples',
        imageUrl: getImageUrl('stains-heavy.png')
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
