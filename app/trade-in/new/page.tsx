'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { SimilarImage } from '@/app/lib/definitions';
import { Button } from '@/app/ui/button';
import ProductForm from '@/app/ui/trade-in/product-form';
import ProductsTable, { ProductFormData } from '@/app/ui/trade-in/products-table';
import AddressAutocomplete from '@/app/ui/address-autocomplete';
import StoreSelect from '@/app/ui/stores/store-select';
import { conditionQuestions, getConditionOptionLabel } from '@/app/lib/trade-in/condition-images';
import { getStateDisplayColors } from '@/app/lib/trade-in/product-condition-evaluator';
import {
  ChevronRightIcon, ChevronDownIcon,
  HomeIcon, MapPinIcon, PlusIcon, CheckCircleIcon, XMarkIcon
} from '@heroicons/react/24/outline';

interface FormData {
  firstName: string;
  lastName: string;
  rut: string;
  email: string;
  phone: string;
  region: string;
  comuna: string;
  address: string;
  houseDetails: string;
}

// Validation functions
const validateRut = (rut: string): boolean => {
  // Remove dots and hyphens
  const cleanRut = rut.replace(/[.-]/g, '');
  
  if (cleanRut.length < 8 || cleanRut.length > 9) return false;
  
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase(); // Convert to uppercase for comparison
  
  // Check if body contains only numbers
  if (!/^\d+$/.test(body)) return false;
  
  // Calculate verification digit using Chilean algorithm
  let sum = 0;
  let multiplier = 2;
  
  // Process from right to left
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = 11 - (sum % 11);
  let calculatedDv;
  
  if (remainder === 11) {
    calculatedDv = '0';
  } else if (remainder === 10) {
    calculatedDv = 'K'; // Use uppercase K
  } else {
    calculatedDv = remainder.toString();
  }
  
  return dv === calculatedDv;
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  // Remove spaces and dashes for validation
  const cleanPhone = phone.replace(/[\s\-]/g, '');
  
  // Accept Chilean format: +569XXXXXXXX or 9XXXXXXXX or 569XXXXXXXX
  const chileanRegex = /^(\+?56)?9[0-9]{8}$/;
  
  // Accept international format: +XX... (at least 10 digits after +)
  const internationalRegex = /^\+[0-9]{10,15}$/;
  
  return chileanRegex.test(cleanPhone) || internationalRegex.test(cleanPhone);
};

// Format phone number - add +569 prefix for Chilean numbers without country code
const formatPhone = (phone: string): string => {
  // Remove spaces and dashes
  const cleanPhone = phone.replace(/[\s\-]/g, '');
  
  // If it already starts with +, don't modify it (user provided country code)
  if (cleanPhone.startsWith('+')) {
    return cleanPhone;
  }
  
  // If it starts with 56 and has 11 digits (569XXXXXXXX), add the +
  if (cleanPhone.startsWith('56') && cleanPhone.length === 11) {
    return `+${cleanPhone}`;
  }
  
  // If it's 9 digits starting with 9 (9XXXXXXXX), add +56
  if (cleanPhone.startsWith('9') && cleanPhone.length === 9) {
    return `+56${cleanPhone}`;
  }
  
  // If it's exactly 8 digits (XXXXXXXX), assume Chilean mobile and add +569
  if (/^[0-9]{8}$/.test(cleanPhone)) {
    return `+569${cleanPhone}`;
  }
  
  // Otherwise return as-is
  return cleanPhone;
};

const formatRut = (rut: string): string => {
  const cleanRut = rut.replace(/[^0-9kK]/g, '');
  if (cleanRut.length <= 1) return cleanRut.toUpperCase();
  
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase(); // Convert to uppercase
  
  // Add dots every 3 digits from right to left
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `${formattedBody}-${dv}`;
};

// Type for error state
type ErrorState = {
  firstName: boolean;
  lastName: boolean;
  rut: boolean;
  email: boolean;
  phone: boolean;
  region: boolean;
  comuna: boolean;
  address: boolean;
};

// Function to validate individual fields on blur
const validateField = (fieldName: keyof FormData, value: string, setErrors: React.Dispatch<React.SetStateAction<ErrorState>>) => {
  setErrors((prevErrors: ErrorState) => {
    const newErrors = { ...prevErrors };
    
    switch (fieldName) {
      case 'firstName':
        newErrors.firstName = !value.trim();
        break;
      case 'lastName':
        newErrors.lastName = !value.trim();
        break;
      case 'rut':
        // RUT is required and must be valid
        newErrors.rut = !value.trim() || !validateRut(value);
        break;
      case 'email':
        newErrors.email = !value.trim() || !validateEmail(value);
        break;
      case 'phone':
        newErrors.phone = !value.trim() || !validatePhone(value);
        break;
      default:
        break;
    }
    
    return newErrors;
  });
};

const TradeInFormPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [similarImages, setSimilarImages] = useState<SimilarImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemColorSuggestions, setItemColorSuggestions] = useState<
    { itemColor: string; imageSrc: string }[]
  >([]);
  const [isImageSectionCollapsed, setImageSectionCollapsed] = useState(true);
  const firstNameInputRef = useRef<HTMLInputElement>(null);
  const rutInputRef = useRef<HTMLInputElement>(null);
  const [deliveryOption, setDeliveryOption] = useState<string>('');
  const [selectedStoreCode, setSelectedStoreCode] = useState<string>('');
  
  // New state for enhanced functionality
  const [products, setProducts] = useState<ProductFormData[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(null);
  const [imageDetectionEnabled, setImageDetectionEnabled] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1); // Estado para controlar el paso actual
  const [showConfirmationModal, setShowConfirmationModal] = useState(false); // Modal de confirmación
  const [catalogImagesLoaded, setCatalogImagesLoaded] = useState<Set<string>>(new Set()); // Track loaded catalog images
  const [catalogImagesFailed, setCatalogImagesFailed] = useState<Set<string>>(new Set()); // Track failed catalog images
  
  // Create ref for products section
  const productsRef = useRef<HTMLDivElement>(null);
  const productFormRef = useRef<HTMLDivElement>(null);

  // Estado para los datos del formulario y errores
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    rut: '',
    email: '',
    phone: '',
    region: '',
    comuna: '',
    address: '',
    houseDetails: ''
  });

  const [errors, setErrors] = useState({
    firstName: false,
    lastName: false,
    rut: false,
    email: false,
    phone: false,
    region: false,
    comuna: false,
    address: false,
  });

  // Fetch configuration and autocomplete data on page load
  useEffect(() => {
    fetchTradeInConfig();
    fetchItemColorSuggestions();
    
    // Preload ALL condition images immediately
    const preloadAllImages = () => {
      conditionQuestions.forEach(question => {
        question.options.forEach(option => {
          const img = new window.Image();
          img.src = option.imageUrl;
          // Force load by adding to DOM temporarily
          img.style.display = 'none';
          document.body.appendChild(img);
          img.onload = () => {
            document.body.removeChild(img);
          };
        });
      });
    };
    
    // Small delay to ensure DOM is ready
    setTimeout(preloadAllImages, 100);
  }, []);

  // Update current step based on form progress
  useEffect(() => {
    if (products.length > 0) {
      if (formData.firstName && formData.lastName && formData.rut && formData.email) {
        setCurrentStep(3); // All data completed
      } else {
        setCurrentStep(2); // Products added, working on personal data
      }
    } else {
      setCurrentStep(1); // Still working on products
    }
  }, [products.length, formData.firstName, formData.lastName, formData.rut, formData.email]);

  // Fetch trade-in configuration
  const fetchTradeInConfig = async () => {
    try {
      const response = await fetch('/api/trade-in/config');
      const data = await response.json();
      setImageDetectionEnabled(data.imageDetectionEnabled || false);
      setConfigLoaded(true);
    } catch (error) {
      console.error('Error fetching trade-in config:', error);
      // Default to false if config fails
      setImageDetectionEnabled(false);
      setConfigLoaded(true);
    }
  };

  // Fetch ITEM_COLOR suggestions for autocomplete along with IMAGE_SRC
  const fetchItemColorSuggestions = async () => {
    try {
      const response = await fetch('/api/trade-in/autocomplete');
      const data = await response.json();
      setItemColorSuggestions(data.itemColors || []);
    } catch (error) {
      console.error('Error fetching ITEM_COLOR and IMAGE_SRC suggestions:', error);
    }
  };

  // Toggle collapse for the image upload section
  const toggleImageSection = () => {
    setImageSectionCollapsed(!isImageSectionCollapsed);
  };

  // Handles file selection and generates preview URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setSimilarImages([]);
    }
  };

  // Handles form submission for image processing
  const handleImageSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    try {
      const response = await fetch('/api/trade-in/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error('Error uploading image');
      }

      const data = await response.json();
      setSimilarImages(data.similarImages);
    } catch (error) {
      setError('Error uploading image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle image selection and create product from it
  const handleImageSelect = (itemColor: string) => {
    const newProduct: ProductFormData = {
      id: Date.now().toString(),
      product_style: '',
      product_size: '',
      usage_signs: '',
      pilling_level: '',
      tears_holes_level: '',
      repairs_level: '',
      stains_level: '',
      meets_minimum_requirements: true,
      product_images: []
    };
    
    setEditingProduct(newProduct);
    setShowProductForm(true);
    setImageSectionCollapsed(true);
  };

  // Handle address selection from Google Maps Autocomplete
  const handleAddressSelect = (addressData: { address: string; region: string; comuna: string; place: google.maps.places.PlaceResult }) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      address: addressData.address,
      region: addressData.region,
      comuna: addressData.comuna,
    }));
  };

  // Handle form input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
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

  // Product management functions
  const handleAddProduct = (product: ProductFormData) => {
    setProducts(prev => [...prev, product]);
    setShowProductForm(false);
    setEditingProduct(null);
    
    // Ensure scroll to products section after adding product
    setTimeout(() => {
      if (productsRef.current) {
        productsRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 400); // Delay to ensure all state updates and re-renders complete
  };

  const handleUpdateProduct = (updatedProduct: ProductFormData) => {
    setProducts(prev => 
      prev.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    );
    setShowProductForm(false);
    setEditingProduct(null);
    
    // Scroll to products table after updating product
    setTimeout(() => {
      if (productsRef.current) {
        productsRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 400);
  };

  const handleEditProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setEditingProduct(product);
      setShowProductForm(true);
      
      // Scroll to product style input field after form renders
      setTimeout(() => {
        const styleInput = document.getElementById('product_style');
        if (styleInput) {
          styleInput.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          styleInput.focus();
        }
      }, 200);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleCancelProductForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };

  // Handle "Agregar Producto" button click with scroll to products section
  const handleAgregarProductoClick = () => {
    setShowProductForm(true);
    // Scroll to products section with longer delay to ensure all state updates complete
    setTimeout(() => {
      if (productsRef.current) {
        productsRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 300); // Increased delay to handle step changes
  };

  // Validate main form
  const validateMainForm = (): boolean => {
    const newErrors = {
      firstName: !formData.firstName.trim(),
      lastName: !formData.lastName.trim(),
      rut: !formData.rut.trim() || !validateRut(formData.rut),
      email: !formData.email.trim() || !validateEmail(formData.email),
      phone: !formData.phone.trim() || !validatePhone(formData.phone),
      region: !formData.region.trim(),
      comuna: !formData.comuna.trim(),
      address: !formData.address.trim(),
    };

    setErrors(newErrors);

    // Validate delivery method
    if (!deliveryOption) {
      setError('Por favor selecciona un método de entrega');
      return false;
    }

    return !Object.values(newErrors).some(Boolean);
  };

  // Submit the complete trade-in request
  const handleSubmitTradeInRequest = async () => {
    if (!validateMainForm()) {
      // Debug: mostrar qué campos fallan
      const debugErrors = {
        firstName: !formData.firstName.trim(),
        lastName: !formData.lastName.trim(),
        rut: !formData.rut.trim() || !validateRut(formData.rut),
        email: !formData.email.trim() || !validateEmail(formData.email),
        phone: !formData.phone.trim() || !validatePhone(formData.phone),
        region: !formData.region.trim(),
        comuna: !formData.comuna.trim(),
        address: !formData.address.trim(),
      };
      const camposFallidos = Object.entries(debugErrors)
        .filter(([_, hasError]) => hasError)
        .map(([field]) => field);
      console.log('Campos con error:', camposFallidos);
      console.log('Valores actuales:', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        rut: formData.rut,
        email: formData.email,
        phone: formData.phone,
        region: formData.region,
        comuna: formData.comuna,
        address: formData.address,
        deliveryOption,
        selectedStoreCode
      });
      setError(`Por favor completa todos los campos obligatorios. Campos con error: ${camposFallidos.join(', ')}`);
      setShowConfirmationModal(false);
      return;
    }

    if (products.length === 0) {
      setError('Debes agregar al menos un producto');
      setShowConfirmationModal(false);
      return;
    }

    setIsSubmittingRequest(true);
    setError(null);

    try {
      const requestData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        rut: formData.rut,
        email: formData.email,
        phone: formData.phone,
        region: formData.region,
        comuna: formData.comuna,
        deliveryMethod: deliveryOption,
        receivedStoreCode: deliveryOption === 'store' ? selectedStoreCode : null,
        address: formData.address,
        houseDetails: formData.houseDetails,
        products: products
      };

      const response = await fetch('/api/trade-in/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creating trade-in request');
      }

      const result = await response.json();
      
      // Close modal and clean up on success
      setShowConfirmationModal(false);
      setCatalogImagesLoaded(new Set());
      setCatalogImagesFailed(new Set());
      
      setSuccessMessage(`¡Solicitud creada exitosamente! Número de solicitud: ${result.requestNumber}`);
      
      // Different behavior based on authentication status
      setTimeout(() => {
        if (session && session.user) {
          // User is logged in: redirect to trade-in list
          window.location.href = '/trade-in';
        } else {
          // User is not logged in: reload the same form (clean state)
          window.location.href = '/trade-in/new';
        }
      }, 2000);

    } catch (error) {
      console.error('Error submitting trade-in request:', error);
      setError(error instanceof Error ? error.message : 'Error al crear la solicitud');
      // Keep modal open on error so user can try again
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  if (successMessage) {
    const isLoggedIn = session && session.user;
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Solicitud Enviada!</h2>
          <p className="text-gray-600 mb-4">{successMessage}</p>
          {isLoggedIn ? (
            <p className="text-sm text-gray-500">Redirigiendo al listado en 2 segundos...</p>
          ) : (
            <div className="text-sm text-gray-500">
              <p className="mb-1">¡Gracias por tu solicitud!</p>
              <p>Regresando al formulario en 2 segundos...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 font-ridgeway">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="text-left">
              <h1 className="font-copernicus text-3xl font-bold text-gray-900 mb-4">
                Formulario de intercambio
              </h1>
              <p className="text-lg text-gray-700 leading-relaxed">
                <strong>Tráenos o envíanos lo que ya no uses </strong> y recibe crédito para seguir
                explorando con Patagonia. Completa este formulario por cada prenda: revisaremos si puede ser parte del programa de intercambio. Tu crédito podrás usarlo en tiendas o en nuestra web.
              </p>
            </div>
          </div>

          {/* Steps Images Section */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* Paso 1 */}
              <div className="flex justify-center">
                <div className="w-64 h-16 flex items-center justify-center">
                  <Image 
                    src="https://form-builder-by-hulkapps.s3.amazonaws.com/uploads/patagoniachile.myshopify.com/backend_image/Group_244.png" 
                    alt="Paso 1: Identifica tu producto"
                    width={250} 
                    height={50}
                    className="object-contain max-w-full max-h-full"
                  />
                </div>
              </div>
              
              {/* Paso 2 */}
              <div className="flex justify-center">
                <div className="w-64 h-16 flex items-center justify-center">
                  <Image 
                    src="https://form-builder-by-hulkapps.s3.amazonaws.com/uploads/patagoniachile.myshopify.com/backend_image/Estado.png" 
                    alt="Paso 2: Estado del producto"
                    width={250} 
                    height={50}
                    className="object-contain max-w-full max-h-full"
                  />
                </div>
              </div>
              
              {/* Paso 3 */}
              <div className="flex justify-center">
                <div className="w-64 h-16 flex items-center justify-center">
                  <Image 
                    src="https://form-builder-by-hulkapps.s3.amazonaws.com/uploads/patagoniachile.myshopify.com/backend_image/Datos.png" 
                    alt="Paso 3: Datos"
                    width={250} 
                    height={50}
                    className="object-contain max-w-full max-h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Image Detection Section (if enabled) */}
          {configLoaded && imageDetectionEnabled && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <button
                type="button"
                onClick={toggleImageSection}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
              >
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Detección de Producto por Imagen (Opcional)
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Sube una imagen para detectar automáticamente el código del producto
                  </p>
                </div>
                {isImageSectionCollapsed ? (
                  <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {!isImageSectionCollapsed && (
                <div className="px-6 pb-6 border-t border-gray-200">
                  <form onSubmit={handleImageSubmit} className="mt-4">
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="dropzone-file"
                        className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg
                            className="w-8 h-8 mb-4 text-gray-500"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 20 16"
                          >
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                            />
                          </svg>
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click para subir</span> o arrastra y suelta
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG o JPEG</p>
                        </div>
                        <input
                          id="dropzone-file"
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          accept="image/*"
                        />
                      </label>
                    </div>

                    {previewUrl && (
                      <div className="mt-4">
                        <div className="relative h-48 w-48 mx-auto">
                          <Image
                            src={previewUrl}
                            alt="Preview"
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                        <div className="mt-4 text-center">
                          <Button type="submit" disabled={loading}>
                            {loading ? 'Procesando...' : 'Detectar Producto'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </form>

                  {/* Similar Images Results */}
                  {similarImages.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Productos Detectados
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {similarImages.map((image, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
                            onClick={() => handleImageSelect(image.item_color)}
                          >
                            <div className="relative h-32 mb-2">
                              <Image
                                src={image.image_src}
                                alt={image.item_color}
                                fill
                                className="object-cover rounded"
                              />
                            </div>
                            <p className="text-sm font-medium text-gray-900 text-center">
                              {image.item_color}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Products Section */}
          <div ref={productsRef} className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header with "Productos" label */}
            <div className="flex items-start py-4 border-b border-gray-200 pl-6">
              <h2 className="text-lg font-semibold text-gray-900">Productos</h2>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-end mb-6">
                <Button
                  onClick={handleAgregarProductoClick}
                  className="flex items-center space-x-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Agregar Producto</span>
                </Button>
              </div>

            {/* Product Form */}
            {showProductForm && (
              <div ref={productFormRef} className="mb-6">
                <ProductForm
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onCancel={handleCancelProductForm}
                  editingProduct={editingProduct}
                  itemColorSuggestions={itemColorSuggestions}
                  imageDetectionEnabled={imageDetectionEnabled}
                />
              </div>
            )}

            {/* Products Table */}
            <ProductsTable
              products={products}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
            />

            </div>
          </div>

          {/* Customer Information - Only show when at least one product is added */}
          {products.length > 0 && (
            <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Paso 3 Image */}
              <div className="flex items-start py-4 border-b border-gray-200 pl-6">
                <Image 
                  src="https://form-builder-by-hulkapps.s3.amazonaws.com/uploads/patagoniachile.myshopify.com/backend_image/Datos.png" 
                  alt="Paso 3: Datos personales"
                  width={160} 
                  height={59}
                  className="object-contain"
                />
              </div>
              
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Datos del Cliente</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  ref={firstNameInputRef}
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  onBlur={(e) => validateField('firstName', e.target.value, setErrors)}
                  className={`block w-full rounded-md border px-3 py-2 text-sm ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                  required
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">El nombre es requerido</p>
                )}
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
                  onBlur={(e) => validateField('lastName', e.target.value, setErrors)}
                  className={`block w-full rounded-md border px-3 py-2 text-sm ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                  required
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">El apellido es requerido</p>
                )}
              </div>

              {/* RUT */}
              <div>
                <label htmlFor="rut" className="block text-sm font-medium text-gray-700 mb-1">
                  RUT <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="rut"
                  ref={rutInputRef}
                  value={formData.rut}
                  onChange={(e) => {
                    const formatted = formatRut(e.target.value);
                    handleInputChange('rut', formatted);
                  }}
                  onBlur={(e) => validateField('rut', e.target.value, setErrors)}
                  placeholder="12.345.678-K"
                  className={`block w-full rounded-md border px-3 py-2 text-sm ${
                    errors.rut ? 'border-red-500' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                  required
                />
                {errors.rut && (
                  <p className="mt-1 text-sm text-red-600">
                    {!formData.rut.trim() ? 'El RUT es requerido' : 'RUT inválido'}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onBlur={(e) => validateField('email', e.target.value, setErrors)}
                  className={`block w-full rounded-md border px-3 py-2 text-sm ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">Correo electrónico inválido</p>
                )}
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
                  onBlur={(e) => {
                    // Format the phone number (add +569 if needed)
                    const formattedPhone = formatPhone(e.target.value);
                    if (formattedPhone !== e.target.value) {
                      handleInputChange('phone', formattedPhone);
                    }
                    validateField('phone', formattedPhone, setErrors);
                  }}
                  placeholder="+56 9 1234 5678"
                  className={`block w-full rounded-md border px-3 py-2 text-sm ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                  required
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">Teléfono inválido</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="mt-4">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Dirección <span className="text-red-500">*</span>
              </label>
              <AddressAutocomplete
                onPlaceSelected={handleAddressSelect}
              />
            </div>

            {/* Region and Comuna */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Region */}
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                  Región <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="region"
                  value={formData.region}
                  onChange={(e) => handleInputChange('region', e.target.value)}
                  className={`block w-full rounded-md border px-3 py-2 text-sm ${
                    errors.region ? 'border-red-500' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                  required
                />
              </div>

              {/* Comuna */}
              <div>
                <label htmlFor="comuna" className="block text-sm font-medium text-gray-700 mb-1">
                  Comuna <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="comuna"
                  value={formData.comuna}
                  onChange={(e) => handleInputChange('comuna', e.target.value)}
                  className={`block w-full rounded-md border px-3 py-2 text-sm ${
                    errors.comuna ? 'border-red-500' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                  required
                />
              </div>
            </div>

            {/* House Details */}
            <div className="mt-4">
              <label htmlFor="houseDetails" className="block text-sm font-medium text-gray-700 mb-1">
                Detalles de la Dirección
              </label>
              <input
                type="text"
                id="houseDetails"
                value={formData.houseDetails}
                onChange={(e) => handleInputChange('houseDetails', e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ej: Departamento 4B, Casa 123, etc."
              />
            </div>

            {/* Delivery Method */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Método de Entrega <span className="text-red-500">*</span>
              </label>
              <div className="space-y-4">
                {/* Shipping Option */}
                <div 
                  onClick={() => setDeliveryOption('shipping')}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    deliveryOption === 'shipping' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`mt-1 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                      deliveryOption === 'shipping' 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {deliveryOption === 'shipping' && (
                        <div className="h-2 w-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Envíos por Chilexpress o Blue Express</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Te enviaremos una etiqueta digital para que puedas realizar el envío gratuito desde cualquier sucursal.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pickup Option */}
                <div 
                  onClick={() => setDeliveryOption('pickup')}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    deliveryOption === 'pickup' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`mt-1 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                      deliveryOption === 'pickup' 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {deliveryOption === 'pickup' && (
                        <div className="h-2 w-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Retiros a domicilio</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Te contactaremos para coordinar el retiro de tu producto en un plazo de 5 días hábiles desde que ingresaste la solicitud entre las 09:00 y las 18:00
                      </p>
                    </div>
                  </div>
                </div>

                {/* Store Delivery Option */}
                <div 
                  onClick={() => setDeliveryOption('store')}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    deliveryOption === 'store' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`mt-1 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                      deliveryOption === 'store' 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {deliveryOption === 'store' && (
                        <div className="h-2 w-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Entrega en tienda</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Lleva tu producto directamente a una de nuestras tiendas durante el horario de atención.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => setShowConfirmationModal(true)}
                disabled={isSubmittingRequest || products.length === 0}
                className="cursor-pointer px-8 py-3"
              >
                {isSubmittingRequest ? 'Enviando Solicitud...' : 'Enviar Solicitud Trade-in'}
              </Button>
            </div>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => {
                if (!isSubmittingRequest) {
                  setShowConfirmationModal(false);
                  setCatalogImagesLoaded(new Set());
                  setCatalogImagesFailed(new Set());
                }
              }}
            />
            
            {/* Modal Content */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-20">
                <h2 className="text-xl font-semibold text-gray-900">
                  Confirmar Solicitud Trade-in
                </h2>
                <button
                  onClick={() => {
                    if (!isSubmittingRequest) {
                      setShowConfirmationModal(false);
                      setCatalogImagesLoaded(new Set());
                      setCatalogImagesFailed(new Set());
                    }
                  }}
                  disabled={isSubmittingRequest}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-4">
                <p className="text-sm text-gray-600 mb-6">
                  Revisa el resumen de tu solicitud antes de confirmar:
                </p>

                {/* Products Summary */}
                <div className="space-y-6">
                  {products.map((product, index) => {
                    // Generate catalog image URL
                    const getCatalogImageUrl = (productStyle: string) => {
                      if (!productStyle || productStyle.length < 8) return null;
                      const formattedStyle = productStyle.replace('-', '_');
                      return `https://production-us2.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/images/hi-res/${formattedStyle}.jpg?sw=400&sh=400&sfrm=png&q=90&bgcolor=f5f5f5`;
                    };
                    const catalogImageUrl = getCatalogImageUrl(product.product_style);
                    
                    return (
                    <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-4">
                        {/* Catalog Image in Header */}
                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative">
                          {catalogImageUrl && !catalogImagesFailed.has(product.id) ? (
                            <>
                              {/* Loading skeleton */}
                              {!catalogImagesLoaded.has(product.id) && (
                                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                                  <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              )}
                              <Image
                                src={catalogImageUrl}
                                alt={`${product.product_style} - Catálogo`}
                                width={64}
                                height={64}
                                className={`object-cover w-full h-full transition-opacity duration-200 ${
                                  catalogImagesLoaded.has(product.id) ? 'opacity-100' : 'opacity-0'
                                }`}
                                onLoad={() => {
                                  setCatalogImagesLoaded(prev => new Set(prev).add(product.id));
                                }}
                                onError={() => {
                                  setCatalogImagesFailed(prev => new Set(prev).add(product.id));
                                }}
                              />
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                              <span className="text-xs">Sin imagen</span>
                            </div>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-900">
                          Producto {index + 1}: {product.product_style}
                        </h3>
                      </div>
                      
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Product Info & Condition */}
                          <div className="space-y-4">
                            {/* Basic Info */}
                            <div>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Talla:</span> {product.product_size}
                              </p>
                            </div>

                            {/* State */}
                            {product.calculated_state && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Estado:</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  getStateDisplayColors(product.calculated_state as any).bg
                                } ${getStateDisplayColors(product.calculated_state as any).text}`}>
                                  {product.calculated_state}
                                </span>
                              </div>
                            )}

                            {/* Credit Message */}
                            {product.credit_message && (
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-sm text-blue-800 font-medium">
                                  {product.credit_message}
                                </p>
                              </div>
                            )}

                            {/* Product Comment */}
                            {product.product_comment && (
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs font-medium text-gray-500 mb-1">Comentario:</p>
                                <p className="text-sm text-gray-700 italic">
                                  &ldquo;{product.product_comment}&rdquo;
                                </p>
                              </div>
                            )}

                            {/* Condition Details */}
                            <div className="text-xs space-y-1">
                              <p className="font-medium text-gray-700 mb-2">Condición declarada:</p>
                              <div className="grid grid-cols-2 gap-1">
                                <span className="text-gray-500">Señales de uso:</span>
                                <span className="font-medium">{getConditionOptionLabel('usage_signs', product.usage_signs)}</span>
                                
                                {product.usage_signs === 'yes' && (
                                  <>
                                    <span className="text-gray-500">Pilling:</span>
                                    <span className="font-medium">{getConditionOptionLabel('pilling_level', product.pilling_level)}</span>
                                    
                                    <span className="text-gray-500">Manchas:</span>
                                    <span className="font-medium">{getConditionOptionLabel('stains_level', product.stains_level)}</span>
                                    
                                    <span className="text-gray-500">Rasgaduras:</span>
                                    <span className="font-medium">{getConditionOptionLabel('tears_holes_level', product.tears_holes_level)}</span>
                                    
                                    <span className="text-gray-500">Reparaciones:</span>
                                    <span className="font-medium">{getConditionOptionLabel('repairs_level', product.repairs_level)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Product Images */}
                          {product.product_images && product.product_images.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                Imágenes cargadas ({product.product_images.length})
                              </p>
                              <div className="grid grid-cols-3 gap-2">
                                {product.product_images.slice(0, 6).map((imageUrl, imgIndex) => (
                                  <div key={imgIndex} className="relative aspect-square bg-gray-100 rounded overflow-hidden">
                                    <Image
                                      src={imageUrl}
                                      alt={`${product.product_style} - Imagen ${imgIndex + 1}`}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                ))}
                                {product.product_images.length > 6 && (
                                  <div className="aspect-square bg-gray-100 rounded flex items-center justify-center">
                                    <span className="text-sm text-gray-500">
                                      +{product.product_images.length - 6}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                  })}
                </div>

                {/* Disclaimer */}
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <span className="font-semibold">Importante:</span> Entiendo que Patagonia revisará el producto y que la evaluación final podría modificar el estado declarado y el crédito asociado.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmationModal(false);
                    setCatalogImagesLoaded(new Set());
                    setCatalogImagesFailed(new Set());
                  }}
                  disabled={isSubmittingRequest}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Volver a Editar
                </button>
                <Button
                  onClick={() => {
                    handleSubmitTradeInRequest();
                  }}
                  disabled={isSubmittingRequest}
                >
                  {isSubmittingRequest ? 'Enviando...' : 'Confirmar y Enviar'}
                </Button>
              </div>

              {/* Loading Overlay */}
              {isSubmittingRequest && (
                <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-10 rounded-lg">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-lg font-medium text-gray-900">Enviando solicitud...</p>
                  <p className="text-sm text-gray-500 mt-2">Por favor espera mientras procesamos tu solicitud</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeInFormPage;
