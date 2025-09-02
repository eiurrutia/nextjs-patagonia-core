'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/app/ui/button';
import ConditionAssessment from './condition-assessment';
import { 
  evaluateProductCondition, 
  areConditionResponsesComplete,
  getStateDisplayColors,
  type ConditionResponses,
  type ProductState
} from '@/app/lib/trade-in/product-condition-evaluator';

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
  meets_minimum_requirements: false,
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
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [calculatedState, setCalculatedState] = useState<ProductState | null>(null);

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

  // Generate Patagonia image URL from product style
  const generatePatagoniaImageUrl = (productStyle: string) => {
    if (!productStyle || !productStyle.includes('-')) {
      return null;
    }
    
    // Convert format from "25551-NVNY" to "25551_NVNY"
    const formattedStyle = productStyle.replace('-', '_');
    
    // Generate Patagonia image URL
    return `https://production-us2.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/images/hi-res/${formattedStyle}.jpg?sw=2000&sh=2000&sfrm=png&q=95&bgcolor=f5f5f5`;
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
        const imageUrl = generatePatagoniaImageUrl(value);
        if (imageUrl) {
          setImageLoading(true);
          setMatchedImageUrl(imageUrl);
          setImageError(false);
        } else {
          setMatchedImageUrl(null);
          setImageError(false);
          setImageLoading(false);
        }
      } else {
        setMatchedImageUrl(null);
        setImageError(false);
        setImageLoading(false);
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

  // Calculate product state whenever condition responses change
  useEffect(() => {
    const conditionResponses: Partial<ConditionResponses> = {
      usage_signs: formData.usage_signs as any,
      pilling_level: formData.pilling_level as any,
      tears_holes_level: formData.tears_holes_level as any,
      repairs_level: formData.repairs_level as any
    };

    if (areConditionResponsesComplete(conditionResponses)) {
      const state = evaluateProductCondition(conditionResponses);
      setCalculatedState(state);
    } else {
      setCalculatedState(null);
    }
  }, [formData.usage_signs, formData.pilling_level, formData.tears_holes_level, formData.repairs_level]);

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
        ...formData,
        calculated_state: calculatedState || undefined
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
        setImageError(false);
        setImageLoading(false);
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
    setImageError(false);
    setImageLoading(false);
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

      {/* Instructional Section - ¿Dónde encuentro mi número de estilo? */}
      <div className="mb-6 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ¿Dónde encuentro mi número de estilo?
        </h3>
        <div className="flex justify-start mb-4">
          <Image 
            src="https://form-builder-by-hulkapps.s3.amazonaws.com/uploads/patagoniachile.myshopify.com/backend_image/Frame_20__1_.png" 
            alt="Ubicación del número de estilo en las etiquetas"
            width={400} 
            height={200}
            className="object-contain rounded-lg"
          />
        </div>
        <p className="text-sm text-gray-600">
          Busca en las etiquetas internas de tu producto el número de 4 o 5 dígitos.
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
            {matchedImageUrl && !imageError && (
              <div className="mt-2">
                <div className="relative h-32 w-32 border border-gray-200 rounded overflow-hidden">
                  {imageLoading && (
                    <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  <Image
                    src={matchedImageUrl}
                    alt="Vista previa del producto"
                    fill
                    sizes="128px"
                    className="object-cover"
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                      setImageError(true);
                      setImageLoading(false);
                      setMatchedImageUrl(null);
                    }}
                  />
                </div>
                <p className="text-xs text-blue-600 mt-1">🔗 Vista previa desde catálogo Patagonia</p>
              </div>
            )}
            
            {/* Loading State when no image yet */}
            {imageLoading && !matchedImageUrl && (
              <div className="mt-2">
                <div className="h-32 w-32 border border-gray-200 rounded overflow-hidden bg-gray-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">🔍 Cargando imagen...</p>
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

        {/* Photo Instructions */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-sm font-bold text-gray-900 mb-3">
            ¿Cómo debo fotografiar mi producto?
          </h3>
          <p className="text-sm text-gray-700 mb-4">
            Asegúrate de incluir vistas frontales y traseras de tu producto estirado sobre un fondo plano y buena iluminación. 
            En caso de observar detalles de uso como pilling o rasgaduras en este, incluye fotos del (los) detalle(s) de cerca.
          </p>
          <div className="flex justify-center">
            <Image 
              src="https://cdn.shopify.com/s/files/1/0012/1661/0359/files/Group_9.png?v=1747139966" 
              alt="Ejemplos de cómo fotografiar productos"
              width={500} 
              height={200}
              className="object-contain rounded-lg"
            />
          </div>
        </div>

        {/* Product Images Section */}
        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Imágenes del Producto</h4>
            
            {/* Image Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="mt-4">
                  <label htmlFor="product-images" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Sube imágenes de tu producto
                    </span>
                    <span className="mt-2 block text-sm text-gray-500">
                      PNG, JPG, JPEG hasta 10MB cada una
                    </span>
                  </label>
                  <input
                    id="product-images"
                    name="product-images"
                    type="file"
                    multiple
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      // TODO: Implementar lógica de carga de imágenes
                      console.log('Archivos seleccionados:', e.target.files);
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Preview area for uploaded images */}
            {formData.product_images && formData.product_images.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Imágenes subidas:</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.product_images.map((imageUrl, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={imageUrl}
                        alt={`Producto ${index + 1}`}
                        width={150}
                        height={150}
                        className="object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          // TODO: Implementar eliminación de imagen
                          console.log('Eliminar imagen:', index);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Condition Assessment */}
        <div ref={conditionAssessmentRef}>
          <ConditionAssessment
            values={conditionValues}
            onChange={handleConditionChange}
            errors={errors}
          />
        </div>

        {/* Calculated Product State */}
        {calculatedState && (
          <div className="mt-6 p-4 rounded-lg border bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Estado Evaluado del Producto</h3>
            <div className="flex items-center gap-3">
              <span 
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  getStateDisplayColors(calculatedState).bg
                } ${getStateDisplayColors(calculatedState).text} ${
                  getStateDisplayColors(calculatedState).border
                } border`}
              >
                {calculatedState}
              </span>
              <p className="text-xs text-gray-600">
                Estado calculado automáticamente basado en las respuestas de condición
              </p>
            </div>
          </div>
        )}

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
