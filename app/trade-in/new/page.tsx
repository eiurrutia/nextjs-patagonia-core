'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { SimilarImage } from '@/app/lib/definitions';
import { Button } from '@/app/ui/button';
import { lusitana } from '@/app/ui/fonts';
import ProductForm from '@/app/ui/trade-in/product-form';
import ProductsTable, { ProductFormData } from '@/app/ui/trade-in/products-table';
import AddressAutocomplete from '@/app/ui/address-autocomplete';
import { conditionQuestions } from '@/app/lib/trade-in/condition-images';
import {
  ChevronRightIcon, ChevronDownIcon,
  HomeIcon, MapPinIcon, PlusIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  region: string;
  comuna: string;
  address: string;
  houseDetails: string;
  client_comment: string;
}

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
  const [deliveryOption, setDeliveryOption] = useState<string>('');
  
  // New state for enhanced functionality
  const [products, setProducts] = useState<ProductFormData[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(null);
  const [imageDetectionEnabled, setImageDetectionEnabled] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1); // Estado para controlar el paso actual

  // Estado para los datos del formulario y errores
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    region: '',
    comuna: '',
    address: '',
    houseDetails: '',
    client_comment: ''
  });

  const [errors, setErrors] = useState({
    firstName: false,
    lastName: false,
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
      if (formData.firstName && formData.lastName && formData.email) {
        setCurrentStep(3); // All data completed
      } else {
        setCurrentStep(2); // Products added, working on personal data
      }
    } else {
      setCurrentStep(1); // Still working on products
    }
  }, [products.length, formData.firstName, formData.lastName, formData.email]);

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
      credit_range: '',
      usage_signs: '',
      pilling_level: '',
      tears_holes_level: '',
      repairs_level: '',
      meets_minimum_requirements: true,
      product_images: []
    };
    
    setEditingProduct(newProduct);
    setShowProductForm(true);
    setImageSectionCollapsed(true);
  };

  // Handle address selection from Google Maps Autocomplete
  const handleAddressSelect = (addressData: { address: string; region: string; comuna: string; place: google.maps.places.PlaceResult }) => {
    console.log('Address data received:', addressData); // Para debugging
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
  };

  const handleUpdateProduct = (updatedProduct: ProductFormData) => {
    setProducts(prev => 
      prev.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    );
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const handleEditProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setEditingProduct(product);
      setShowProductForm(true);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleCancelProductForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };

  // Validate main form
  const validateMainForm = (): boolean => {
    const newErrors = {
      firstName: !formData.firstName.trim(),
      lastName: !formData.lastName.trim(),
      email: !formData.email.trim(),
      phone: !formData.phone.trim(),
      region: !formData.region.trim(),
      comuna: !formData.comuna.trim(),
      address: !formData.address.trim(),
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  // Submit the complete trade-in request
  const handleSubmitTradeInRequest = async () => {
    if (!validateMainForm()) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    if (products.length === 0) {
      setError('Debes agregar al menos un producto');
      return;
    }

    setIsSubmittingRequest(true);
    setError(null);

    try {
      const requestData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        region: formData.region,
        comuna: formData.comuna,
        deliveryMethod: deliveryOption,
        address: formData.address,
        houseDetails: formData.houseDetails,
        clientComment: formData.client_comment,
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`${lusitana.className} text-3xl font-bold text-gray-900 mb-4`}>
            Programa de Intercambio Patagonia
          </h1>
          <div className="bg-blue-50 p-6 rounded-lg mb-6 max-w-3xl mx-auto">
            <p className="text-lg text-gray-700 leading-relaxed">
              <strong>Tráenos o envíanos esos productos que ya no quieras</strong> y que cumplan con nuestros 
              criterios de intercambio. A cambio, recibirás un crédito que podrás usar en cualquiera de 
              nuestras tiendas o en nuestra página web.
            </p>
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header with "Productos" label */}
            <div className="flex items-start py-4 border-b border-gray-200 pl-6">
              <h2 className="text-lg font-semibold text-gray-900">Productos</h2>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-end mb-6">
                <Button
                  onClick={() => setShowProductForm(true)}
                  className="flex items-center space-x-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Agregar Producto</span>
                </Button>
              </div>

            {/* Product Form */}
            {showProductForm && (
              <div className="mb-6">
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

          {/* Customer Information */}
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
                  className={`block w-full rounded-md border px-3 py-2 text-sm ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                  required
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
                  required
                />
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
                  className={`block w-full rounded-md border px-3 py-2 text-sm ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  } focus:border-blue-500 focus:ring-blue-500`}
                  required
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
                  required
                />
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
              </div>
            </div>

            {/* Client Comment */}
            <div className="mt-6">
              <label htmlFor="client_comment" className="block text-sm font-medium text-gray-700 mb-1">
                Cuéntanos algo más sobre la historia de tu(s) producto(s)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Nos interesa mucho saber las historias que viviste con el producto y las historias que él tiene para contarnos!
              </p>
              <textarea
                id="client_comment"
                rows={4}
                value={formData.client_comment}
                onChange={(e) => handleInputChange('client_comment', e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Comparte la historia de tu producto: aventuras, momentos especiales, lugares que visitaste con él..."
              />
            </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitTradeInRequest}
              disabled={isSubmittingRequest || products.length === 0}
              className="px-8 py-3"
            >
              {isSubmittingRequest ? 'Enviando Solicitud...' : 'Enviar Solicitud Trade-in'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeInFormPage;
