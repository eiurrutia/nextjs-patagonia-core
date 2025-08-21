// Types and interfaces for Trade-in forms

export type TradeInFormMode = 'ecom' | 'store-new' | 'store-reception';

export interface StoreInfo {
  id: string;
  name: string;
  address: string;
  region: string;
  comuna: string;
  phone: string;
  email: string;
}

export interface TradeInFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  region: string;
  comuna: string;
  address: string;
  houseDetails: string;
  client_comment: string;
  deliveryMethod?: string;
}

export interface TradeInFormContext {
  mode: TradeInFormMode;
  storeInfo?: StoreInfo;
  initialData?: Partial<TradeInFormData>;
  allowEditing?: (keyof TradeInFormData)[];
  hideFields?: (keyof TradeInFormData)[];
  requiredFields?: (keyof TradeInFormData)[];
}

export interface TradeInFormProps {
  context: TradeInFormContext;
  onSubmit: (data: TradeInFormData & { products: any[] }) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

// Default configurations for each mode
export const FORM_CONFIGS: Record<TradeInFormMode, Partial<TradeInFormContext>> = {
  'ecom': {
    requiredFields: ['firstName', 'lastName', 'email', 'phone', 'region', 'comuna', 'address'],
    hideFields: [],
    allowEditing: ['firstName', 'lastName', 'email', 'phone', 'region', 'comuna', 'address', 'houseDetails', 'client_comment', 'deliveryMethod']
  },
  'store-new': {
    requiredFields: ['firstName', 'lastName', 'email', 'phone'],
    hideFields: ['address', 'region', 'comuna', 'houseDetails', 'deliveryMethod'],
    allowEditing: ['firstName', 'lastName', 'email', 'phone', 'client_comment']
  },
  'store-reception': {
    requiredFields: ['firstName', 'lastName', 'email', 'phone'],
    hideFields: ['deliveryMethod'],
    allowEditing: ['client_comment'] // Only allow editing comments during reception
  }
};
