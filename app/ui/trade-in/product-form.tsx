'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/app/ui/button';
import ConditionAssessment from './condition-assessment';

import { ProductFormData } from './products-table';

interface ProductFormProps {
  onAddProduct: (product: ProductFormData) => void;
  onCancel?: () => void;
  editingProduct?: ProductFormData | null;
  onUpdateProduct?: (product: ProductFormData) => void;
  itemColorSuggestions: { itemColor: string; imageSrc: string }[];
  imageDetectionEnabled: boolean;
}

interface ProductFormState {
  product_style: string;
  product_size: string;
  credit_range: string;
  usage_signs: string;
  pilling_level: string;
  tears_holes_level: string;
  repairs_level: string;
  meets_minimum_requirements: boolean;
  product_images: string[];
}

const initialFormState: ProductFormState = {
  product_style: '',
  product_size: '',
  credit_range: '',
  usage_signs: '',
  pilling_level: '',
  tears_holes_level: '',
  repairs_level: '',
  meets_minimum_requirements: true,
  product_images: []
};

export default function ProductForm({ 
  onAddProduct, 
  onCancel, 
  editingProduct, 
  onUpdateProduct,
  itemColorSuggestions,
  imageDetectionEnabled 
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormState>(initialFormState);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [matchedImageUrl, setMatchedImageUrl] = useState<string | null>(null);

  // Refs for form fields to enable scrolling to errors
  const productStyleRef = useRef<HTMLInputElement>(null);
  const productSizeRef = useRef<HTMLInputElement>(null);
  const conditionAssessmentRef = useRef<HTMLDivElement>(null);

  // Load editing product data
  useEffect(() => {
    if (editingProduct) {
      setFormData({
        product_style: editingProduct.product_style,
        product_size: editingProduct.product_size,
        credit_range: editingProduct.credit_range || '',
        usage_signs: editingProduct.usage_signs,
        pilling_level: editingProduct.pilling_level,
        tears_holes_level: editingProduct.tears_holes_level,
        repairs_level: editingProduct.repairs_level,
        meets_minimum_requirements: editingProduct.meets_minimum_requirements,
        product_images: editingProduct.product_images || []
      });
    }
  }, [editingProduct]);

  // Fetch the image if ITEM_COLOR matches
  const fetchItemColorMatch = (itemColor: string) => {
    const match = itemColorSuggestions.find(
      (item) => item.itemColor === itemColor
    );
    if (match) {
      setMatchedImageUrl(match.imageSrc);
    } else {
      setMatchedImageUrl(null);
    }
  };

  const handleInputChange = (field: keyof ProductFormState, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: false
      }));
    }

    // Handle style-color matching
    if (field === 'product_style' && typeof value === 'string') {
      if (value.length > 0) {
        fetchItemColorMatch(value);
      } else {
        setMatchedImageUrl(null);
      }
    }
  };

  const handleConditionChange = (questionId: string, value: string) => {
    if (questionId === 'meets_minimum_requirements') {
      handleInputChange('meets_minimum_requirements', value === 'true');
    } else {
      handleInputChange(questionId as keyof ProductFormState, value);
    }
  };

  const scrollToFirstError = (errorFields: string[]) => {
    const fieldRefMap: Record<string, React.RefObject<HTMLElement>> = {
      'product_style': productStyleRef,
      'product_size': productSizeRef,
      'usage_signs': conditionAssessmentRef,
      'pilling_level': conditionAssessmentRef,
      'tears_holes_level': conditionAssessmentRef,
      'repairs_level': conditionAssessmentRef,
    };

    // Find the first error field that has a ref
    for (const field of errorFields) {
      const ref = fieldRefMap[field];
      if (ref?.current) {
        ref.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        // Focus the input if it's focusable
        if (ref.current instanceof HTMLInputElement) {
          ref.current.focus();
        }
        break;
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, boolean> = {};

    // Required fields
    if (!formData.product_style.trim()) newErrors.product_style = true;
    if (!formData.product_size.trim()) newErrors.product_size = true;

    // Condition questions
    if (!formData.usage_signs) newErrors.usage_signs = true;
    if (!formData.pilling_level) newErrors.pilling_level = true;
    if (!formData.tears_holes_level) newErrors.tears_holes_level = true;
    if (!formData.repairs_level) newErrors.repairs_level = true;

    setErrors(newErrors);
    
    // Scroll to first error if validation fails
    const errorFields = Object.keys(newErrors);
    if (errorFields.length > 0) {
      setTimeout(() => scrollToFirstError(errorFields), 100);
    }
    
    return errorFields.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const productData: ProductFormData = {
        id: editingProduct?.id || Date.now().toString(),
        ...formData
      };

      if (editingProduct && onUpdateProduct) {
        onUpdateProduct(productData);
      } else {
        onAddProduct(productData);
      }

      // Reset form if not editing
      if (!editingProduct) {
        setFormData(initialFormState);
        setMatchedImageUrl(null);
      }
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormState);
    setErrors({});
    setMatchedImageUrl(null);
    if (onCancel) {
      onCancel();
    }
  };

  const conditionValues = {
    usage_signs: formData.usage_signs,
    pilling_level: formData.pilling_level,
    tears_holes_level: formData.tears_holes_level,
    repairs_level: formData.repairs_level,
    meets_minimum_requirements: formData.meets_minimum_requirements.toString()
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Completa la información del producto que deseas incluir en tu Trade-in
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Style (Estilo-Color combinado) */}
          <div>
            <label htmlFor="product_style" className="block text-sm font-medium text-gray-700 mb-1">
              Product Style (Estilo-Color) <span className="text-red-500">*</span>
            </label>
            <input
              ref={productStyleRef}
              type="text"
              id="product_style"
              value={formData.product_style}
              onChange={(e) => handleInputChange('product_style', e.target.value)}
              className={`block w-full rounded-md border px-3 py-2 text-sm ${
                errors.product_style ? 'border-red-500' : 'border-gray-300'
              } focus:border-blue-500 focus:ring-blue-500`}
              placeholder="Ej: 25528-BLK, 50155-STH, etc."
              list="style-suggestions"
            />
            <datalist id="style-suggestions">
              {itemColorSuggestions.map((suggestion, index) => (
                <option key={index} value={suggestion.itemColor} />
              ))}
            </datalist>
            {errors.product_style && (
              <p className="text-red-500 text-xs mt-1">El estilo del producto es obligatorio</p>
            )}
            
            {/* Matched Image Preview */}
            {matchedImageUrl && (
              <div className="mt-2">
                <div className="relative h-32 w-32 border border-gray-200 rounded overflow-hidden">
                  <Image
                    src={matchedImageUrl}
                    alt="Producto encontrado"
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                </div>
                <p className="text-xs text-green-600 mt-1">✓ Producto encontrado en catálogo</p>
              </div>
            )}
          </div>

          {/* Product Size */}
          <div>
            <label htmlFor="product_size" className="block text-sm font-medium text-gray-700 mb-1">
              Talla <span className="text-red-500">*</span>
            </label>
            <input
              ref={productSizeRef}
              type="text"
              id="product_size"
              value={formData.product_size}
              onChange={(e) => handleInputChange('product_size', e.target.value)}
              className={`block w-full rounded-md border px-3 py-2 text-sm ${
                errors.product_size ? 'border-red-500' : 'border-gray-300'
              } focus:border-blue-500 focus:ring-blue-500`}
              placeholder="Ej: M, L, XL"
            />
            {errors.product_size && (
              <p className="text-red-500 text-xs mt-1">La talla es obligatoria</p>
            )}
          </div>
        </div>

        {/* Credit Range */}
        <div>
          <label htmlFor="credit_range" className="block text-sm font-medium text-gray-700 mb-1">
            Rango de Créditos
          </label>
          <input
            type="text"
            id="credit_range"
            value={formData.credit_range}
            onChange={(e) => handleInputChange('credit_range', e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Ej: $15,000 - $25,000"
          />
        </div>

        {/* Condition Assessment */}
        <div ref={conditionAssessmentRef}>
          <ConditionAssessment
            values={conditionValues}
            onChange={handleConditionChange}
            errors={errors}
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancelar
          </button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : editingProduct ? 'Actualizar Producto' : 'Agregar Producto'}
          </Button>
        </div>
      </form>
    </div>
  );
}
