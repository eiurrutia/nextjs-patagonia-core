'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/app/ui/button';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { conditionQuestions } from '@/app/lib/trade-in/condition-images';
import { ProductFormData } from '@/app/ui/trade-in/products-table';
import { TradeInFormData } from '@/app/lib/trade-in/form-types';
import Image from 'next/image';
import { 
  getRepairOptionsForQuestion, 
  calculateConditionLevel 
} from '@/app/lib/trade-in/condition-scoring';

interface StoreReceptionFormProps {
  onSubmit: (data: TradeInFormData & { 
    products: ProductFormData[];
    modifiedConditions?: ModifiedCondition[];
    productRepairs?: ProductRepairs[];
  }) => Promise<void>;
  isSubmitting?: boolean;
  initialData?: Partial<TradeInFormData>;
  initialProducts?: ProductFormData[];
  tradeInId?: string;
  deliveryMethod?: string;
}

interface ModifiedCondition {
  productId: string;
  questionId: string;
  originalValue: string;
  newValue: string;
}

interface RepairOption {
  id: string;
  label: string;
  category: string;
  description?: string;
}

interface ProductRepairs {
  productId: string;
  pilling_level_repairs: string[];
  tears_holes_level_repairs: string[];
  repairs_level_repairs: string[];
  stains_level_repairs: string[];
}

export default function StoreReceptionForm({
  onSubmit,
  isSubmitting = false,
  initialData,
  initialProducts = [],
  tradeInId,
  deliveryMethod: deliveryMethodProp
}: StoreReceptionFormProps) {
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [formData, setFormData] = useState<TradeInFormData>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    rut: initialData?.rut || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    region: initialData?.region || '',
    comuna: initialData?.comuna || '',
    address: initialData?.address || '',
    houseDetails: initialData?.houseDetails || '',
    client_comment: initialData?.client_comment || '',
    deliveryMethod: 'store'
  });

  const [products, setProducts] = useState<ProductFormData[]>(initialProducts);
  const [modifiedConditions, setModifiedConditions] = useState<ModifiedCondition[]>([]);
  const [productRepairs, setProductRepairs] = useState<ProductRepairs[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Store original values when products are loaded
  const [originalProductValues, setOriginalProductValues] = useState<Record<string, Record<string, string>>>({});

  // Capture original values on mount and initialize product repairs with calculated levels
  useEffect(() => {
    const originals: Record<string, Record<string, string>> = {};
    const initialRepairs: ProductRepairs[] = [];
    const initialModifications: ModifiedCondition[] = [];
    const updatedProducts: ProductFormData[] = [];

    initialProducts.forEach(product => {
      // Store original values
      originals[product.id] = {
        pilling_level: (product as any).pilling_level,
        tears_holes_level: (product as any).tears_holes_level,
        repairs_level: (product as any).repairs_level,
        stains_level: (product as any).stains_level,
        usage_signs: (product as any).usage_signs
      };

      // Initialize empty repairs for each product
      initialRepairs.push({
        productId: product.id,
        pilling_level_repairs: [],
        tears_holes_level_repairs: [],
        repairs_level_repairs: [],
        stains_level_repairs: []
      });

      // Calculate initial levels (no_presenta since no repairs selected)
      // and track modifications for questions that have repair selectors
      const questionIds = ['pilling_level', 'tears_holes_level', 'repairs_level', 'stains_level'];
      const productUpdates: any = { ...product };

      questionIds.forEach(questionId => {
        const originalValue = (product as any)[questionId];
        const calculatedValue = 'no_presenta'; // Empty repairs = no_presenta

        // If original value differs from calculated, mark as modified
        if (originalValue && originalValue !== calculatedValue) {
          initialModifications.push({
            productId: product.id,
            questionId,
            originalValue,
            newValue: calculatedValue
          });
          productUpdates[questionId] = calculatedValue;
        }
      });

      updatedProducts.push(productUpdates as ProductFormData);
    });

    setOriginalProductValues(originals);
    setProductRepairs(initialRepairs);
    setModifiedConditions(initialModifications);
    setProducts(updatedProducts);
  }, [initialProducts]);

  const [errors, setErrors] = useState({
    firstName: false,
    lastName: false,
    rut: false,
    email: false,
    phone: false,
  });

  const handleInputChange = (field: keyof TradeInFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [field]: false
      }));
    }
  };

  const handleConditionChange = (productId: string, questionId: string, newValue: string, skipUsageSignsSync: boolean = false) => {
    // Get the original value from our stored originals
    const originalValue = originalProductValues[productId]?.[questionId] || (products.find(p => p.id === productId) as any)?.[questionId];
    
    // If changing usage_signs to "no", clear all repairs for this product
    if (questionId === 'usage_signs' && newValue === 'no') {
      clearAllRepairsForProduct(productId);
    }
    
    // Track the modification
    if (originalValue !== newValue) {
      setModifiedConditions(prev => {
        const existing = prev.find(m => m.productId === productId && m.questionId === questionId);
        if (existing) {
          return prev.map(m => 
            m.productId === productId && m.questionId === questionId 
              ? { ...m, newValue }
              : m
          );
        } else {
          return [...prev, { productId, questionId, originalValue, newValue }];
        }
      });
    } else {
      // Remove from modified list if back to original
      setModifiedConditions(prev => 
        prev.filter(m => !(m.productId === productId && m.questionId === questionId))
      );
    }

    // Update the product condition
    setProducts(prev => 
      prev.map(product => {
        if (product.id === productId) {
          return {
            ...product,
            [questionId]: newValue
          };
        }
        return product;
      })
    );
  };

  // Clear all repairs for a product (when usage_signs = "no")
  const clearAllRepairsForProduct = (productId: string) => {
    const questionIds = ['pilling_level', 'tears_holes_level', 'repairs_level', 'stains_level'];
    
    // Clear all repairs
    setProductRepairs(prev => 
      prev.map(pr => {
        if (pr.productId === productId) {
          return {
            ...pr,
            pilling_level_repairs: [],
            tears_holes_level_repairs: [],
            repairs_level_repairs: [],
            stains_level_repairs: []
          };
        }
        return pr;
      })
    );

    // Set all condition levels to no_presenta and track modifications
    questionIds.forEach(questionId => {
      const originalValue = originalProductValues[productId]?.[questionId];
      const newValue = 'no_presenta';
      
      // Track modification if different from original
      if (originalValue && originalValue !== newValue) {
        setModifiedConditions(prev => {
          const existing = prev.find(m => m.productId === productId && m.questionId === questionId);
          if (existing) {
            return prev.map(m => 
              m.productId === productId && m.questionId === questionId 
                ? { ...m, newValue }
                : m
            );
          } else {
            return [...prev, { productId, questionId, originalValue, newValue }];
          }
        });
      } else {
        // Remove from modified if back to original
        setModifiedConditions(prev => 
          prev.filter(m => !(m.productId === productId && m.questionId === questionId))
        );
      }
    });

    // Update all product conditions to no_presenta
    setProducts(prev => 
      prev.map(product => {
        if (product.id === productId) {
          return {
            ...product,
            pilling_level: 'no_presenta',
            tears_holes_level: 'no_presenta',
            repairs_level: 'no_presenta',
            stains_level: 'no_presenta'
          };
        }
        return product;
      })
    );
  };

  // Check if any repairs are selected for a product
  const hasAnyRepairsSelectedForProduct = (productId: string, repairsToCheck: ProductRepairs[]): boolean => {
    const repairs = repairsToCheck.find(pr => pr.productId === productId);
    if (!repairs) return false;
    
    return (
      repairs.pilling_level_repairs.length > 0 ||
      repairs.tears_holes_level_repairs.length > 0 ||
      repairs.repairs_level_repairs.length > 0 ||
      repairs.stains_level_repairs.length > 0
    );
  };

  // Function to update usage_signs based on repairs - called after repair changes
  const updateUsageSignsBasedOnRepairs = (productId: string, updatedRepairs: ProductRepairs[]) => {
    const hasRepairs = hasAnyRepairsSelectedForProduct(productId, updatedRepairs);
    
    // Get current usage_signs from products state
    setProducts(prevProducts => {
      const product = prevProducts.find(p => p.id === productId);
      const currentUsageSigns = (product as any)?.usage_signs;
      
      if (hasRepairs && currentUsageSigns === 'no') {
        // If repairs selected but usage_signs is "no", change to "yes"
        const originalValue = originalProductValues[productId]?.usage_signs;
        const newValue = 'yes';
        
        // Track modification
        if (originalValue !== newValue) {
          setModifiedConditions(prev => {
            const existing = prev.find(m => m.productId === productId && m.questionId === 'usage_signs');
            if (existing) {
              return prev.map(m => 
                m.productId === productId && m.questionId === 'usage_signs' 
                  ? { ...m, newValue }
                  : m
              );
            } else {
              return [...prev, { productId, questionId: 'usage_signs', originalValue: originalValue || 'no', newValue }];
            }
          });
        } else {
          setModifiedConditions(prev => 
            prev.filter(m => !(m.productId === productId && m.questionId === 'usage_signs'))
          );
        }
        
        return prevProducts.map(p => 
          p.id === productId ? { ...p, usage_signs: 'yes' } : p
        );
      } else if (!hasRepairs && currentUsageSigns === 'yes') {
        // If no repairs and usage_signs is "yes", change to "no"
        const originalValue = originalProductValues[productId]?.usage_signs;
        const newValue = 'no';
        
        // Track modification
        if (originalValue !== newValue) {
          setModifiedConditions(prev => {
            const existing = prev.find(m => m.productId === productId && m.questionId === 'usage_signs');
            if (existing) {
              return prev.map(m => 
                m.productId === productId && m.questionId === 'usage_signs' 
                  ? { ...m, newValue }
                  : m
              );
            } else {
              return [...prev, { productId, questionId: 'usage_signs', originalValue: originalValue || 'yes', newValue }];
            }
          });
        } else {
          setModifiedConditions(prev => 
            prev.filter(m => !(m.productId === productId && m.questionId === 'usage_signs'))
          );
        }
        
        return prevProducts.map(p => 
          p.id === productId ? { ...p, usage_signs: 'no' } : p
        );
      }
      
      return prevProducts;
    });
  };

  const validateForm = (): boolean => {
    const newErrors = {
      firstName: !formData.firstName.trim(),
      lastName: !formData.lastName.trim(),
      rut: !formData.rut.trim(),
      email: !formData.email.trim(),
      phone: !formData.phone.trim(),
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    // Pass verification data along with form data, including the updated delivery method
    await onSubmit({ 
      ...formData,
      deliveryMethod: deliveryMethodProp || initialData?.deliveryMethod || 'shipping',
      products,
      modifiedConditions,
      productRepairs
    });
  };

  const isConditionModified = (productId: string, questionId: string) => {
    return modifiedConditions.some(m => m.productId === productId && m.questionId === questionId);
  };

  // Generate Patagonia image URL from product style
  const generatePatagoniaImageUrl = (productStyle: string) => {
    if (!productStyle || productStyle.length < 8) return null;
    
    // Replace dash with underscore for Patagonia URL format
    const formattedStyle = productStyle.replace('-', '_');
    
    // Generate Patagonia image URL
    return `https://production-us2.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/images/hi-res/${formattedStyle}.jpg?sw=2000&sh=2000&sfrm=png&q=95&bgcolor=f5f5f5`;
  };

  // Get original value for a condition
  const getOriginalValue = (productId: string, questionId: string) => {
    // First check if we have the original value stored
    if (originalProductValues[productId]?.[questionId]) {
      return originalProductValues[productId][questionId];
    }
    // Fallback to current value if not found
    return (products.find(p => p.id === productId) as any)?.[questionId];
  };

  // Initialize product repairs if not exists
  const initializeProductRepairs = (productId: string) => {
    if (!productRepairs.find(pr => pr.productId === productId)) {
      setProductRepairs(prev => [...prev, {
        productId,
        pilling_level_repairs: [],
        tears_holes_level_repairs: [],
        repairs_level_repairs: [],
        stains_level_repairs: []
      }]);
    }
  };

  // Handle repair option toggle
  const handleRepairToggle = (productId: string, questionId: string, repairId: string) => {
    initializeProductRepairs(productId);
    
    let updatedRepairsRef: ProductRepairs[] = [];
    
    setProductRepairs(prev => {
      const updated = prev.map(pr => {
        if (pr.productId === productId) {
          const repairKey = `${questionId}_repairs` as keyof ProductRepairs;
          const currentRepairs = (pr[repairKey] as string[]) || [];
          const isSelected = currentRepairs.includes(repairId);
          
          return {
            ...pr,
            [repairKey]: isSelected 
              ? currentRepairs.filter(id => id !== repairId)
              : [...currentRepairs, repairId]
          };
        }
        return pr;
      });
      
      // Store reference to updated repairs
      updatedRepairsRef = updated;
      
      // Calculate new condition level based on updated repairs
      const productRepair = updated.find(pr => pr.productId === productId);
      if (productRepair) {
        const repairKey = `${questionId}_repairs` as keyof ProductRepairs;
        const selectedRepairs = productRepair[repairKey] as string[];
        const repairOptions = getRepairOptionsForQuestion(questionId);
        const newLevel = calculateConditionLevel(selectedRepairs, repairOptions);
        
        // Update the product condition automatically
        handleConditionChange(productId, questionId, newLevel, true);
      }
      
      return updated;
    });
    
    // Sync usage_signs after state update using setTimeout to ensure state is updated
    setTimeout(() => {
      updateUsageSignsBasedOnRepairs(productId, updatedRepairsRef);
    }, 0);
  };

  // Get repairs for a product and question
  const getProductRepairs = (productId: string, questionId: string): string[] => {
    const repairs = productRepairs.find(pr => pr.productId === productId);
    if (!repairs) return [];
    const repairKey = `${questionId}_repairs` as keyof ProductRepairs;
    return repairs[repairKey] as string[] || [];
  };

  // Save store verification
  const handleSaveVerification = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch(`/api/trade-in/store-verification/${tradeInId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products,
          modifiedConditions,
          productRepairs,
          verifiedBy: 'sistema_tienda' // TODO: obtener del contexto de sesión
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSaveSuccess(true);
        // Opcional: resetear modificaciones ya que se guardaron
        // setModifiedConditions([]);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error(result.message || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error saving verification:', error);
      alert('Error al guardar la verificación. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  // Render repair options for specific questions
  const renderRepairOptions = (productId: string, questionId: string) => {
    const options = getRepairOptionsForQuestion(questionId);
    if (!options || options.length === 0) return null;

    const selectedRepairs = getProductRepairs(productId, questionId);

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options.map((option) => {
            const isSelected = selectedRepairs.includes(option.id);
            return (
              <label
                key={option.id}
                className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-sm ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleRepairToggle(productId, questionId, option.id)}
                  className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-3 flex-1">
                  <div className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                    {option.label}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
        {selectedRepairs.length > 0 && (
          <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-blue-900">
                {selectedRepairs.length} {selectedRepairs.length > 1 ? 'opciones seleccionadas' : 'opción seleccionada'}
              </span>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-8">
      {/* Client Information Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Información del Cliente</h2>
          <button
            type="button"
            onClick={() => setIsEditingClient(!isEditingClient)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            title={isEditingClient ? "Cancelar edición" : "Editar información"}
          >
            {isEditingClient ? (
              <XMarkIcon className="h-5 w-5" />
            ) : (
              <PencilIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        <div className="p-6">
          {isEditingClient ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`block w-full rounded-md border px-3 py-2 text-sm ${
                      errors.firstName ? 'border-red-500' : 'border-gray-300'
                    } focus:border-blue-500 focus:ring-blue-500`}
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`block w-full rounded-md border px-3 py-2 text-sm ${
                      errors.lastName ? 'border-red-500' : 'border-gray-300'
                    } focus:border-blue-500 focus:ring-blue-500`}
                  />
                </div>

                {/* RUT */}
                <div>
                  <label htmlFor="rut" className="block text-sm font-medium text-gray-700 mb-1">
                    RUT <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="rut"
                    value={formData.rut}
                    onChange={(e) => handleInputChange('rut', e.target.value)}
                    className={`block w-full rounded-md border px-3 py-2 text-sm ${
                      errors.rut ? 'border-red-500' : 'border-gray-300'
                    } focus:border-blue-500 focus:ring-blue-500`}
                    placeholder="12345678-9"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`block w-full rounded-md border px-3 py-2 text-sm ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    } focus:border-blue-500 focus:ring-blue-500`}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`block w-full rounded-md border px-3 py-2 text-sm ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    } focus:border-blue-500 focus:ring-blue-500`}
                  />
                </div>
              </div>

              {/* Address - Full width */}
              <div className="mt-4">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Calle, número, depto/casa"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEditingClient(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingClient(false)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <CheckIcon className="h-4 w-4 inline mr-1" />
                  Guardar
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Datos Personales</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nombre:</span>
                    <span className="font-medium">{formData.firstName} {formData.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">RUT:</span>
                    <span className="font-medium">{formData.rut}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Teléfono:</span>
                    <span className="font-medium">{formData.phone}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Ubicación</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Región:</span>
                    <span className="font-medium">{formData.region}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Comuna:</span>
                    <span className="font-medium">{formData.comuna}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dirección:</span>
                    <span className="font-medium">{formData.address}</span>
                  </div>
                  {formData.houseDetails && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Detalles:</span>
                      <span className="font-medium">{formData.houseDetails}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {formData.client_comment && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Historia del Producto</h4>
              <p className="text-sm text-gray-600">{formData.client_comment}</p>
            </div>
          )}
        </div>
      </div>

      {/* Products Condition Assessment */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Verificación de Condición de Productos</h2>
          <p className="text-sm text-gray-600 mt-1">
            Revisa y confirma el estado de cada producto. Los cambios se marcarán visualmente.
          </p>
          <div className="flex items-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-500"></span>
              <span className="text-gray-600">Marcado por el cliente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-orange-500"></span>
              <span className="text-gray-600">Confirmado/modificado por tienda</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {products.map((product, index) => (
            <div key={product.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center">
                  {(() => {
                    const imageUrl = generatePatagoniaImageUrl(product.product_style);
                    if (imageUrl) {
                      return (
                        <Image
                          src={imageUrl}
                          alt={`${product.product_style}`}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            // Fallback to number if image fails
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<span class="text-lg font-semibold text-gray-600">${index + 1}</span>`;
                            }
                          }}
                        />
                      );
                    } else {
                      return (
                        <span className="text-lg font-semibold text-gray-600">
                          {index + 1}
                        </span>
                      );
                    }
                  })()}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{product.product_style}</h3>
                  <p className="text-sm text-gray-600">Talla: {product.product_size}</p>
                </div>
              </div>

              <div className="space-y-4">
                {conditionQuestions.map((question) => {
                  const isUsageSignsQuestion = question.id === 'usage_signs';
                  
                  return (
                    <div key={question.id} className="bg-gray-50 rounded-lg border border-gray-200 p-6 shadow-sm">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">{question.question}</h4>
                      
                      {isUsageSignsQuestion ? (
                        // Simple buttons for usage signs question (no images)
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {question.options.map((option) => {
                            const currentValue = (product as any)[question.id];
                            const originalValue = getOriginalValue(product.id, question.id);
                            const isCurrentlySelected = currentValue === option.value;
                            const isOriginalValue = originalValue === option.value;
                            const isModified = isConditionModified(product.id, question.id);
                            
                            // Determine border color
                            let borderClass = 'border-gray-200 hover:border-gray-300';
                            if (isCurrentlySelected && isOriginalValue && !isModified) {
                              borderClass = 'border-blue-500 bg-blue-50'; // Original selection
                            } else if (isCurrentlySelected && isModified) {
                              borderClass = 'border-orange-500 bg-orange-50'; // Modified selection
                            } else if (isOriginalValue && !isCurrentlySelected) {
                              borderClass = 'border-blue-300 bg-blue-25'; // Show original option
                            }
                            
                            return (
                              <button
                                key={option.value}
                                type="button"
                                className={`p-4 rounded-lg border-2 transition-all text-left hover:shadow-md min-h-[100px] flex relative ${borderClass}`}
                                onClick={() => handleConditionChange(product.id, question.id, option.value)}
                              >
                                {isModified && isCurrentlySelected && (
                                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">!</span>
                                  </div>
                                )}
                                
                                <div className="flex items-start justify-between w-full">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-900 mb-2 leading-none">{option.label}</h5>
                                    <p className="text-sm text-gray-600 leading-relaxed">{option.description}</p>
                                  </div>
                                  
                                  {isCurrentlySelected && (
                                    <div className="ml-3 flex-shrink-0 mt-0">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                        isModified ? 'bg-orange-500' : 'bg-blue-500'
                                      }`}>
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        // Image-based options for other questions (NOT clickeable - calculated by selectors)
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {question.options.map((option) => {
                            const currentValue = (product as any)[question.id];
                            const originalValue = getOriginalValue(product.id, question.id);
                            const isCurrentlySelected = currentValue === option.value;
                            const isOriginalValue = originalValue === option.value;
                            const isModified = isConditionModified(product.id, question.id);
                            
                            // Determine styling
                            let borderClass = 'border-gray-200';
                            let bgClass = '';
                            
                            // Original value styling (always in blue, but lighter if not current)
                            if (isOriginalValue && !isModified) {
                              // Original and still current
                              borderClass = 'border-blue-500';
                              bgClass = 'bg-blue-50';
                            } else if (isOriginalValue && isModified) {
                              // Original but not current anymore (lighter blue)
                              borderClass = 'border-blue-300';
                              bgClass = 'bg-blue-25';
                            } else if (isCurrentlySelected && isModified) {
                              // Current calculated value (orange)
                              borderClass = 'border-orange-500';
                              bgClass = 'bg-orange-50';
                            }
                            
                            return (
                              <div
                                key={option.value}
                                className={`relative rounded-lg border-2 p-3 ${borderClass} ${bgClass}`}
                              >
                                {/* Badge for modified (orange with !) */}
                                {isModified && isCurrentlySelected && (
                                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">!</span>
                                  </div>
                                )}
                                
                                {/* Badge for original when it's still current (blue with check) */}
                                {isOriginalValue && !isModified && (
                                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                                
                                <div className="relative w-full h-24 bg-gray-100 rounded overflow-hidden mb-2">
                                  <Image
                                    src={option.imageUrl}
                                    alt={option.label}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                
                                <div className="text-center">
                                  <p className={`text-xs font-medium ${
                                    isCurrentlySelected 
                                      ? isModified 
                                        ? 'text-orange-700' 
                                        : 'text-blue-700'
                                      : isOriginalValue
                                        ? 'text-blue-600'
                                        : 'text-gray-700'
                                  }`}>
                                    {option.label}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Repair Options for specific questions - integrated within the same card */}
                      {(['pilling_level', 'tears_holes_level', 'repairs_level', 'stains_level'].includes(question.id)) && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <div className="flex items-center mb-4">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                            <h4 className="text-sm font-semibold text-gray-900">
                              {question.id === 'pilling_level' 
                                ? 'Selecciona el nivel de pilling' 
                                : '¿Qué se le requiere hacer al producto para dejarlo en buen estado?'}
                            </h4>
                          </div>
                          <p className="text-xs text-gray-600 mb-4 italic">
                            {question.id === 'pilling_level'
                              ? 'Selecciona las opciones que apliquen' 
                              : 'Puedes seleccionar más de una opción'}
                          </p>
                          {renderRepairOptions(product.id, question.id)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modified Conditions Summary */}
      {modifiedConditions.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-orange-900 mb-2">
            Cambios Realizados ({modifiedConditions.length})
          </h3>
          <div className="space-y-1 text-xs text-orange-800">
            {modifiedConditions.map((mod, index) => {
              const product = products.find(p => p.id === mod.productId);
              const question = conditionQuestions.find(q => q.id === mod.questionId);
              return (
                <div key={index}>
                  <strong>{product?.product_style}</strong> - {question?.question}: 
                  <span className="ml-1">
                    {mod.originalValue} → {mod.newValue}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        {/* Save Verification Button */}
        <Button
          onClick={handleSaveVerification}
          disabled={isSaving || (modifiedConditions.length === 0 && productRepairs.length === 0)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white"
          type="button"
        >
          {isSaving ? 'Guardando...' : 'Guardar Verificación'}
        </Button>

        {/* Main Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-8 py-3"
        >
          {isSubmitting ? 'Procesando...' : 'Confirmar Recepción'}
        </Button>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-800 font-medium">
              Verificación guardada exitosamente
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
