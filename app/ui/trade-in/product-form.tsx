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
import {
  extractStyleCode,
  calculateCreditMessage,
  calculateExactCreditValue,
  formatChileanPesos,
  mapProductStateToCondition
} from '@/app/lib/trade-in/credit-utils';

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
  product_style: string;  // Style number (e.g., "27045")
  product_color: string;  // Color code (e.g., "SPYG")
  product_size: string;   // Size (e.g., "M", "L", "ALL")
  credit_estimated: string;
  usage_signs: string;
  pilling_level: string;
  stains_level: string;
  tears_holes_level: string;
  repairs_level: string;
  meets_minimum_requirements: boolean;
  product_images: string[];
}

interface ColorOption {
  code: string;
  name: string;
}

// Interface for credit data from API
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

const initialFormState: ProductFormState = {
  product_style: '',
  product_color: '',
  product_size: '',
  credit_estimated: '',
  usage_signs: '',
  pilling_level: '',
  stains_level: '',
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
  const [creditData, setCreditData] = useState<CreditRange | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [creditMessage, setCreditMessage] = useState<string>('');

  // Cascading autocomplete states
  const [styleSuggestions, setStyleSuggestions] = useState<string[]>([]);
  const [colorSuggestions, setColorSuggestions] = useState<ColorOption[]>([]);
  const [sizeSuggestions, setSizeSuggestions] = useState<string[]>([]);
  const [selectedColorName, setSelectedColorName] = useState<string>('');
  const [selectedSizeDescription, setSelectedSizeDescription] = useState<string>('');
  const [styleExistsInERP, setStyleExistsInERP] = useState<boolean | null>(null);
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);

  // Helper function to get size description for special baby/toddler sizes
  const getSizeDescription = (size: string): string => {
    const sizeDescriptions: Record<string, string> = {
      '6M': '3M a 6M',
      '12M': '6M a 12M',
      '18M': '12M a 18M',
    };
    return sizeDescriptions[size] || '';
  };
  
  // Image fallback state - list of colors to try when image fails
  const [availableColorsForImage, setAvailableColorsForImage] = useState<string[]>([]);
  const [currentColorIndex, setCurrentColorIndex] = useState(0);

  // Refs for form fields to enable scrolling to errors
  const productStyleRef = useRef<HTMLInputElement>(null);
  const productColorRef = useRef<HTMLInputElement>(null);
  const productSizeRef = useRef<HTMLInputElement>(null);
  const conditionAssessmentRef = useRef<HTMLDivElement>(null);

  // Load editing product data
  useEffect(() => {
    if (editingProduct) {
      // Split the stored product_style "27045-SPYG" into style and color
      const [style, color] = editingProduct.product_style.includes('-') 
        ? editingProduct.product_style.split('-') 
        : [editingProduct.product_style, ''];
      
      setFormData({
        product_style: style,
        product_color: color,
        product_size: editingProduct.product_size,
        credit_estimated: editingProduct.credit_estimated || '',
        usage_signs: editingProduct.usage_signs,
        pilling_level: editingProduct.pilling_level,
        stains_level: editingProduct.stains_level || '',
        tears_holes_level: editingProduct.tears_holes_level,
        repairs_level: editingProduct.repairs_level,
        meets_minimum_requirements: editingProduct.meets_minimum_requirements,
        product_images: editingProduct.product_images || []
      });
      
      // Fetch color name if color exists
      if (color) {
        fetchColorName(style, color);
      }
    }
  }, [editingProduct]);

  // Helper function to get the combined style-color for API calls
  const getCombinedStyleColor = () => {
    if (formData.product_style && formData.product_color) {
      return `${formData.product_style}-${formData.product_color}`;
    }
    return formData.product_style;
  };

  // Fetch style suggestions
  const fetchStyleSuggestions = async (search: string) => {
    if (search.length < 2) {
      setStyleSuggestions([]);
      setStyleExistsInERP(null);
      return;
    }
    try {
      const res = await fetch(`/api/trade-in/erp-autocomplete?type=styles&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      const styles = data.styles || [];
      setStyleSuggestions(styles);
      
      // Check if the exact style exists in ERP (when style is complete - 5 digits)
      if (search.length >= 5) {
        const exactMatch = styles.some((s: string) => s === search);
        setStyleExistsInERP(exactMatch);
      } else {
        setStyleExistsInERP(null);
      }
    } catch (error) {
      console.error('Error fetching style suggestions:', error);
    }
  };

  // Fetch color suggestions based on selected style
  const fetchColorSuggestions = async (style: string, search?: string) => {
    try {
      let url = `/api/trade-in/erp-autocomplete?type=colors&style=${encodeURIComponent(style)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      const data = await res.json();
      setColorSuggestions(data.colors || []);
    } catch (error) {
      console.error('Error fetching color suggestions:', error);
    }
  };

  // Fetch size suggestions based on selected style and color
  const fetchSizeSuggestions = async (style: string, color?: string, search?: string) => {
    try {
      let url = `/api/trade-in/erp-autocomplete?type=sizes&style=${encodeURIComponent(style)}`;
      if (color) url += `&color=${encodeURIComponent(color)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      const data = await res.json();
      setSizeSuggestions(data.sizes || []);
    } catch (error) {
      console.error('Error fetching size suggestions:', error);
    }
  };

  // Fetch first available color for a style (for image preview when no color selected)
  const fetchFirstColor = async (style: string): Promise<string | null> => {
    if (!style || style.length < 4) return null;
    try {
      const res = await fetch(`/api/trade-in/erp-autocomplete?type=first-color&style=${encodeURIComponent(style)}`);
      const data = await res.json();
      console.log('🎨 First color for style', style, ':', data.color);
      return data.color || null;
    } catch (error) {
      console.error('Error fetching first color:', error);
      return null;
    }
  };

  // Fetch color name for display
  const fetchColorName = async (style: string, colorCode: string) => {
    try {
      const res = await fetch(`/api/trade-in/erp-autocomplete?type=colors&style=${encodeURIComponent(style)}&search=${encodeURIComponent(colorCode)}`);
      const data = await res.json();
      const matchingColor = data.colors?.find((c: ColorOption) => c.code === colorCode);
      if (matchingColor) {
        setSelectedColorName(matchingColor.name !== colorCode ? matchingColor.name : '');
      }
    } catch (error) {
      console.error('Error fetching color name:', error);
    }
  };

  // Generate Patagonia image URL from style and color
  const generatePatagoniaImageUrl = (style: string, color: string) => {
    if (!style || !color) {
      return null;
    }
    
    // Format: "25551_NVNY"
    const formattedStyle = `${style}_${color}`;
    
    // Generate Patagonia image URL
    return `https://production-us2.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/images/hi-res/${formattedStyle}.jpg?sw=2000&sh=2000&sfrm=png&q=95&bgcolor=f5f5f5`;
  };

  // Try next color when current image fails to load
  const tryNextColorImage = () => {
    const nextIndex = currentColorIndex + 1;
    if (nextIndex < availableColorsForImage.length) {
      const nextColor = availableColorsForImage[nextIndex];
      const imageUrl = generatePatagoniaImageUrl(formData.product_style, nextColor);
      console.log(`🔄 Image failed, trying next color (${nextIndex + 1}/${availableColorsForImage.length}):`, nextColor);
      setCurrentColorIndex(nextIndex);
      if (imageUrl) {
        setMatchedImageUrl(imageUrl);
        setImageError(false);
      }
    } else {
      // No more colors to try
      console.log('❌ No valid image found after trying all colors');
      setMatchedImageUrl(null);
      setImageError(true);
      setImageLoading(false);
    }
  };

  // Update image preview when style or color changes
  const updateImagePreview = async (style: string, color?: string) => {
    if (!style || style.length < 4) {
      setMatchedImageUrl(null);
      setImageError(false);
      setImageLoading(false);
      setAvailableColorsForImage([]);
      setCurrentColorIndex(0);
      return;
    }

    setImageLoading(true);
    setImageError(false);
    
    // If color is provided, use it directly (no fallback needed)
    if (color) {
      const imageUrl = generatePatagoniaImageUrl(style, color);
      console.log('🖼️ Generated image URL with provided color:', imageUrl);
      setAvailableColorsForImage([color]);
      setCurrentColorIndex(0);
      if (imageUrl) {
        setMatchedImageUrl(imageUrl);
      } else {
        setMatchedImageUrl(null);
        setImageLoading(false);
      }
      return;
    }

    // If no color provided, fetch all colors and try them in sequence
    try {
      const res = await fetch(`/api/trade-in/erp-autocomplete?type=colors&style=${encodeURIComponent(style)}`);
      const data = await res.json();
      const colors = data.colors?.map((c: ColorOption) => c.code) || [];
      
      console.log('🎨 Available colors for style', style, ':', colors);
      
      if (colors.length > 0) {
        // Store all colors for fallback
        setAvailableColorsForImage(colors);
        setCurrentColorIndex(0);
        
        // Start with the first color - if it fails, onError will try the next
        const firstColor = colors[0];
        const imageUrl = generatePatagoniaImageUrl(style, firstColor);
        console.log('🖼️ Trying first color:', firstColor, imageUrl);
        if (imageUrl) {
          setMatchedImageUrl(imageUrl);
        } else {
          setMatchedImageUrl(null);
          setImageLoading(false);
        }
      } else {
        // No colors available
        setAvailableColorsForImage([]);
        setCurrentColorIndex(0);
        setMatchedImageUrl(null);
        setImageLoading(false);
      }
    } catch (error) {
      console.error('Error fetching colors for image:', error);
      setMatchedImageUrl(null);
      setImageLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProductFormState, value: string | boolean | string[]) => {
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

    // Handle cascading autocomplete behavior
    if (field === 'product_style' && typeof value === 'string') {
      // When style changes, reset color and size, fetch color suggestions
      if (value !== formData.product_style) {
        setFormData(prev => ({
          ...prev,
          product_style: value,
          product_color: '',
          product_size: ''
        }));
        setSelectedColorName('');
        setSelectedSizeDescription('');
        setColorSuggestions([]);
        setSizeSuggestions([]);
        // Reset style exists check when user is editing
        if (value.length < 5) {
          setStyleExistsInERP(null);
        }
      }
      
      // Fetch style suggestions if typing
      fetchStyleSuggestions(value);
      
      // Fetch colors for this style
      if (value.length >= 4) {
        fetchColorSuggestions(value);
      }
      
      // Clear image when style changes (will be updated by useEffect with debounce)
      if (value.length < 4) {
        setMatchedImageUrl(null);
        setImageError(false);
        setImageLoading(false);
      }
    }

    if (field === 'product_color' && typeof value === 'string') {
      // When color changes, reset size and fetch size suggestions
      if (value !== formData.product_color) {
        setFormData(prev => ({
          ...prev,
          product_color: value,
          product_size: ''
        }));
        setSizeSuggestions([]);
        setSelectedSizeDescription('');
      }
      
      // Find color name from suggestions
      const matchingColor = colorSuggestions.find(c => c.code === value);
      setSelectedColorName(matchingColor?.name !== value ? matchingColor?.name || '' : '');
      
      // Fetch sizes for this style-color
      if (formData.product_style && value) {
        fetchSizeSuggestions(formData.product_style, value);
      }
      
      // Note: Image update is handled by useEffect with debounce
    }

    if (field === 'product_size' && typeof value === 'string') {
      // Update size description based on typed value
      setSelectedSizeDescription(getSizeDescription(value));
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
      stains_level: formData.stains_level as any,
      tears_holes_level: formData.tears_holes_level as any,
      repairs_level: formData.repairs_level as any
    };

    if (areConditionResponsesComplete(conditionResponses)) {
      const state = evaluateProductCondition(conditionResponses);
      setCalculatedState(state);
    } else {
      setCalculatedState(null);
    }
  }, [formData.usage_signs, formData.pilling_level, formData.stains_level, formData.tears_holes_level, formData.repairs_level]);

  // Update image preview when style or color changes (with debounce)
  useEffect(() => {
    // Don't run if style is too short
    if (!formData.product_style || formData.product_style.length < 4) {
      setMatchedImageUrl(null);
      setImageError(false);
      setImageLoading(false);
      setAvailableColorsForImage([]);
      setCurrentColorIndex(0);
      return;
    }

    // Debounce the image preview update
    const timeoutId = setTimeout(() => {
      if (formData.product_color) {
        // Color is set - load image directly for that color (no fallback)
        const imageUrl = generatePatagoniaImageUrl(formData.product_style, formData.product_color);
        console.log('🖼️ Loading image for explicit color:', formData.product_color, imageUrl);
        if (imageUrl) {
          setAvailableColorsForImage([formData.product_color]);
          setCurrentColorIndex(0);
          setImageLoading(true);
          setImageError(false);
          setMatchedImageUrl(imageUrl);
        }
      } else {
        // No color set - fetch colors and iterate until we find a valid image
        console.log('🖼️ No color set, fetching colors for fallback...');
        updateImagePreview(formData.product_style);
      }
    }, 600);

    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.product_style, formData.product_color]);

  // Fetch credit data when product style changes
  useEffect(() => {
    const fetchCreditData = async () => {
      if (!formData.product_style) {
        setCreditData(null);
        setCreditMessage('');
        return;
      }

      const styleCode = extractStyleCode(formData.product_style);
      if (!styleCode) {
        setCreditData(null);
        setCreditMessage('');
        return;
      }

      setLoadingCredits(true);
      try {
        console.log('🔍 Frontend: Fetching credits for style:', styleCode);
        const response = await fetch(`/api/trade-in/product-credits?style=${encodeURIComponent(styleCode)}`);
        
        if (response.ok) {
          const result = await response.json();
          setCreditData(result.data);
          console.log('✅ Frontend: Credit data loaded for style:', styleCode, result.data);
        } else if (response.status === 404) {
          console.log('❌ Frontend: No credit data found for style:', styleCode);
          setCreditData(null);
        } else {
          // Handle other errors (500, etc.)
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('💥 Frontend: API error:', response.status, errorData);
          setCreditData(null);
        }
      } catch (error) {
        console.error('💥 Frontend: Network error fetching credit data:', error);
        setCreditData(null);
      } finally {
        setLoadingCredits(false);
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(fetchCreditData, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.product_style]);

  // Update credit message when state or credit data changes
  useEffect(() => {
    if (creditData && calculatedState) {
      const message = calculateCreditMessage(creditData, calculatedState);
      setCreditMessage(message);
      
      // Calculate the exact credit value for the calculated state
      const exactCreditValue = calculateExactCreditValue(creditData, calculatedState);
      
      // Auto-update the credit_estimated field with the numeric value
      setFormData(prev => ({
        ...prev,
        credit_estimated: exactCreditValue ? exactCreditValue.toString() : ''
      }));
    } else {
      setCreditMessage('');
      setFormData(prev => ({
        ...prev,
        credit_estimated: ''
      }));
    }
  }, [creditData, calculatedState]);

  // Cleanup object URLs when component unmounts to prevent memory leaks
  useEffect(() => {
    const currentImages = formData.product_images;
    return () => {
      currentImages.forEach(imageUrl => {
        if (imageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(imageUrl);
        }
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToFirstError = (errorFields: string[]) => {
    const fieldRefMap: Record<string, React.RefObject<HTMLElement>> = {
      'product_style': productStyleRef,
      'product_color': productColorRef,
      'product_size': productSizeRef,
      'usage_signs': conditionAssessmentRef,
      'pilling_level': conditionAssessmentRef,
      'stains_level': conditionAssessmentRef,
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
    if (!formData.product_color.trim()) newErrors.product_color = true;
    if (!formData.product_size.trim()) newErrors.product_size = true;

    // Product images (at least one required)
    if (formData.product_images.length === 0) newErrors.product_images = true;

    // Condition questions
    if (!formData.usage_signs) newErrors.usage_signs = true;
    if (!formData.pilling_level) newErrors.pilling_level = true;
    if (!formData.stains_level) newErrors.stains_level = true;
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
      // Combine style and color for storage as "STYLE-COLOR"
      const combinedStyleColor = formData.product_color 
        ? `${formData.product_style}-${formData.product_color}`
        : formData.product_style;

      const productData: ProductFormData = {
        id: editingProduct?.id || Date.now().toString(),
        product_style: combinedStyleColor,
        product_size: formData.product_size,
        credit_estimated: formData.credit_estimated,
        usage_signs: formData.usage_signs,
        pilling_level: formData.pilling_level,
        stains_level: formData.stains_level,
        tears_holes_level: formData.tears_holes_level,
        repairs_level: formData.repairs_level,
        meets_minimum_requirements: formData.meets_minimum_requirements,
        product_images: formData.product_images,
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
        setSelectedColorName('');
        setSelectedSizeDescription('');
        setStyleSuggestions([]);
        setColorSuggestions([]);
        setSizeSuggestions([]);
        setAvailableColorsForImage([]);
        setCurrentColorIndex(0);
        setStyleExistsInERP(null);
        setCreditData(null);
        setCreditMessage('');
        setCalculatedState(null);
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
    setSelectedColorName('');
    setSelectedSizeDescription('');
    setStyleSuggestions([]);
    setColorSuggestions([]);
    setSizeSuggestions([]);
    setAvailableColorsForImage([]);
    setCurrentColorIndex(0);
    setStyleExistsInERP(null);
    setCreditData(null);
    setCreditMessage('');
    setCalculatedState(null);
    if (onCancel) {
      onCancel();
    }
  };

  const conditionValues = {
    usage_signs: formData.usage_signs,
    pilling_level: formData.pilling_level,
    stains_level: formData.stains_level,
    tears_holes_level: formData.tears_holes_level,
    repairs_level: formData.repairs_level,
    meets_minimum_requirements: formData.meets_minimum_requirements.toString()
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Paso 1 Image Header */}
      <div className="flex items-start py-4 border-b border-gray-200 pl-6">
        <Image 
          src="https://form-builder-by-hulkapps.s3.amazonaws.com/uploads/patagoniachile.myshopify.com/backend_image/Group_244.png" 
          alt="Paso 1: Identifica tu producto"
          width={250} 
          height={40}
          className="object-contain"
        />
      </div>

      <div className="p-6">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Estilo (Style Number) */}
          <div className="relative">
            <label htmlFor="product_style" className="block text-sm font-medium text-gray-700 mb-1">
              Estilo <span className="text-red-500">*</span>
            </label>
            <input
              ref={productStyleRef}
              type="text"
              id="product_style"
              value={formData.product_style}
              onChange={(e) => handleInputChange('product_style', e.target.value)}
              onFocus={() => setShowStyleDropdown(true)}
              onBlur={() => setTimeout(() => setShowStyleDropdown(false), 200)}
              className={`block w-full rounded-md border px-3 py-2 text-sm ${
                errors.product_style ? 'border-red-500' : 'border-gray-300'
              } focus:border-blue-500 focus:ring-blue-500`}
              placeholder="Ej: 27045, 25528"
              autoComplete="off"
            />
            {/* Style Suggestions Dropdown */}
            {showStyleDropdown && styleSuggestions.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {styleSuggestions.map((style, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                    onMouseDown={() => {
                      handleInputChange('product_style', style);
                      setShowStyleDropdown(false);
                    }}
                  >
                    {style}
                  </div>
                ))}
              </div>
            )}
            {errors.product_style && (
              <p className="text-red-500 text-xs mt-1">El estilo es obligatorio</p>
            )}
          </div>

          {/* Color */}
          <div className="relative">
            <label htmlFor="product_color" className="block text-sm font-medium text-gray-700 mb-1">
              Color <span className="text-red-500">*</span>
            </label>
            <input
              ref={productColorRef}
              type="text"
              id="product_color"
              value={formData.product_color}
              onChange={(e) => handleInputChange('product_color', e.target.value.toUpperCase())}
              onFocus={() => {
                setShowColorDropdown(true);
                if (formData.product_style) {
                  fetchColorSuggestions(formData.product_style);
                }
              }}
              onBlur={() => setTimeout(() => setShowColorDropdown(false), 200)}
              className={`block w-full rounded-md border px-3 py-2 text-sm ${
                errors.product_color ? 'border-red-500' : 'border-gray-300'
              } focus:border-blue-500 focus:ring-blue-500`}
              placeholder="Ej: SPYG, BLK"
              autoComplete="off"
            />
            {/* Color Suggestions Dropdown */}
            {showColorDropdown && colorSuggestions.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {colorSuggestions
                  .filter(colorOpt => 
                    !formData.product_color || 
                    colorOpt.code.toUpperCase().includes(formData.product_color.toUpperCase()) ||
                    (colorOpt.name && colorOpt.name.toUpperCase().includes(formData.product_color.toUpperCase()))
                  )
                  .map((colorOpt, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                    onMouseDown={() => {
                      handleInputChange('product_color', colorOpt.code);
                      setShowColorDropdown(false);
                    }}
                  >
                    <span className="font-medium">{colorOpt.code}</span>
                    {colorOpt.name && colorOpt.name !== colorOpt.code && (
                      <span className="text-gray-500 ml-1">- {colorOpt.name}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {errors.product_color && (
              <p className="text-red-500 text-xs mt-1">El color es obligatorio</p>
            )}
            {/* Show selected color name below field */}
            {selectedColorName && (
              <p className="text-xs text-gray-500 mt-1">{selectedColorName}</p>
            )}
          </div>

          {/* Talla (Size) */}
          <div className="relative">
            <label htmlFor="product_size" className="block text-sm font-medium text-gray-700 mb-1">
              Talla <span className="text-red-500">*</span>
            </label>
            <input
              ref={productSizeRef}
              type="text"
              id="product_size"
              value={formData.product_size}
              onChange={(e) => handleInputChange('product_size', e.target.value)}
              onFocus={() => {
                setShowSizeDropdown(true);
                if (formData.product_style) {
                  fetchSizeSuggestions(formData.product_style, formData.product_color || undefined);
                }
              }}
              onBlur={() => setTimeout(() => setShowSizeDropdown(false), 200)}
              className={`block w-full rounded-md border px-3 py-2 text-sm ${
                errors.product_size ? 'border-red-500' : 'border-gray-300'
              } focus:border-blue-500 focus:ring-blue-500`}
              placeholder="Ej: M, L, XL, ALL"
              autoComplete="off"
            />
            {/* Size Suggestions Dropdown */}
            {showSizeDropdown && sizeSuggestions.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {sizeSuggestions.map((size, index) => {
                  const sizeDesc = getSizeDescription(size);
                  return (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                      onMouseDown={() => {
                        handleInputChange('product_size', size);
                        setSelectedSizeDescription(sizeDesc);
                        setShowSizeDropdown(false);
                      }}
                    >
                      <span className="font-medium">{size}</span>
                      {sizeDesc && (
                        <span className="text-gray-500 ml-1">- {sizeDesc}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {errors.product_size && (
              <p className="text-red-500 text-xs mt-1">La talla es obligatoria</p>
            )}
            {/* Show selected size description below field */}
            {selectedSizeDescription && (
              <p className="text-xs text-gray-500 mt-1">{selectedSizeDescription}</p>
            )}
          </div>
        </div>

        {/* Image Preview - Show below product fields */}
        <div className="mt-2">
          {/* Matched Image Preview */}
          {matchedImageUrl && !imageError && (
            <div>
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
                  onLoad={() => {
                    console.log('✅ Image loaded successfully');
                    setImageLoading(false);
                  }}
                  onError={() => {
                    // Only try next color if we're iterating through available colors (no explicit color set)
                    // and we have more colors to try
                    const isIteratingColors = !formData.product_color && availableColorsForImage.length > 1;
                    const hasMoreColorsToTry = currentColorIndex < availableColorsForImage.length - 1;
                    
                    if (isIteratingColors && hasMoreColorsToTry) {
                      console.log('❌ Image failed to load, trying next color...');
                      tryNextColorImage();
                    } else {
                      console.log('❌ Image failed to load, no more colors to try');
                      setImageError(true);
                      setImageLoading(false);
                      setMatchedImageUrl(null);
                    }
                  }}
                />
              </div>
              <p className="text-xs text-blue-600 mt-1">🔗 Vista previa desde catálogo Patagonia</p>
            </div>
          )}
          
          {/* Loading State when no image yet */}
          {imageLoading && !matchedImageUrl && (
            <div>
              <div className="h-32 w-32 border border-gray-200 rounded overflow-hidden bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">🔍 Cargando imagen...</p>
            </div>
          )}
        </div>

        {/* Style Not Found in ERP Message */}
        {!loadingCredits && styleExistsInERP === false && formData.product_style && formData.product_style.length >= 5 && (
          <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md border border-yellow-200">
            <p className="font-medium mb-2">
              No encontramos ese número de estilo.
            </p>
            <p className="text-sm">
              Revisa que esté correcto, si necesitas ayuda,{' '}
              <a 
                href="https://cl.patagonia.com/pages/formulario-de-intercambios-alternativo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-yellow-900 underline hover:text-yellow-700 font-medium"
              >
                contáctanos
              </a>
              {' '}y te orientaremos.
            </p>
          </div>
        )}

        {/* Product Not Available for Trade-in Message (exists in ERP but not in credits) */}
        {!loadingCredits && !creditData && styleExistsInERP === true && formData.product_style && formData.product_style.length >= 5 && (
          <div className="bg-orange-50 text-orange-800 p-4 rounded-md border border-orange-200">
            <p className="font-medium mb-2">
              🌱 Lo sentimos, este producto no está disponible para trade-in
            </p>
          </div>
        )}

        {/* Only show the rest of the form when product is valid (exists in ERP AND has credit data) */}
        {creditData && styleExistsInERP === true && (
          <>
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
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Imágenes del Producto <span className="text-red-500">*</span>
            </h4>
            
            {/* Image Upload Area */}
            <div className={`border-2 border-dashed rounded-lg p-6 ${errors.product_images ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
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
                      {formData.product_images.length > 0 
                        ? `Agregar más imágenes (${formData.product_images.length} ya subidas)`
                        : 'Sube imágenes de tu producto'
                      }
                    </span>
                    <span className="mt-2 block text-sm text-gray-500">
                      PNG, JPG, JPEG hasta 10MB cada una. Puedes seleccionar múltiples archivos.
                    </span>
                  </label>
                  <input
                    id="product-images"
                    name="product-images"
                    type="file"
                    multiple
                    accept="image/*"
                    className="sr-only"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        // Convert files to base64 for storage
                        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
                        const imagePromises: Promise<string>[] = [];
                        
                        Array.from(files).forEach((file) => {
                          if (file.type.startsWith('image/')) {
                            if (file.size <= maxSize) {
                              const promise = new Promise<string>((resolve, reject) => {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  resolve(reader.result as string);
                                };
                                reader.onerror = reject;
                                reader.readAsDataURL(file);
                              });
                              imagePromises.push(promise);
                            } else {
                              alert(`La imagen "${file.name}" es muy grande. El tamaño máximo es 10MB.`);
                            }
                          }
                        });
                        
                        // Wait for all images to be converted
                        if (imagePromises.length > 0) {
                          try {
                            const base64Images = await Promise.all(imagePromises);
                            // Add new images to existing ones
                            const updatedImages = [...formData.product_images, ...base64Images];
                            handleInputChange('product_images', updatedImages);
                          } catch (error) {
                            console.error('Error converting images:', error);
                            alert('Error al procesar las imágenes. Por favor intenta de nuevo.');
                          }
                        }
                        
                        // Reset input
                        e.target.value = '';
                      }
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
                          // Remove image from array
                          const updatedImages = formData.product_images.filter((_, i) => i !== index);
                          handleInputChange('product_images', updatedImages);
                          
                          // Only revoke blob URLs, not base64 data URLs
                          if (imageUrl.startsWith('blob:')) {
                            URL.revokeObjectURL(imageUrl);
                          }
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
            {errors.product_images && (
              <p className="text-red-500 text-xs mt-2">Debes subir al menos una imagen del producto</p>
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

        {/* Credit Information - Simple Display */}
        {calculatedState && creditData && creditMessage && (
          <div className="mt-6 p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
            <div className={`text-left ${
              calculatedState === 'Reciclado' 
                ? 'text-orange-800' 
                : 'text-blue-800'
            }`}>
              <p className="text-sm font-medium">
                {creditMessage}
              </p>
            </div>
          </div>
        )}

        {/* Form Actions - Only show when meets minimum requirements */}
        {formData.meets_minimum_requirements && (
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
        )}
          </>
        )}
      </form>
      </div>
    </div>
  );
}
