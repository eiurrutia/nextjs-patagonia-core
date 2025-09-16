'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/app/ui/button';
import { PlusIcon } from '@heroicons/react/24/outline';
import ProductForm from '@/app/ui/trade-in/product-form';
import ProductsTable, { ProductFormData } from '@/app/ui/trade-in/products-table';
import { TradeInFormData, TradeInFormMode } from '@/app/lib/trade-in/form-types';

interface TradeInStoreFormProps {
  mode: TradeInFormMode;
  onSubmit: (data: TradeInFormData & { products: ProductFormData[] }) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  initialData?: Partial<TradeInFormData>;
  initialProducts?: ProductFormData[];
}

export default function TradeInStoreForm({
  mode,
  onSubmit,
  onCancel,
  isSubmitting = false,
  initialData,
  initialProducts = []
}: TradeInStoreFormProps) {
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
    deliveryMethod: initialData?.deliveryMethod || ''
  });

  const [errors, setErrors] = useState({
    firstName: false,
    lastName: false,
    rut: false,
    email: false,
    phone: false,
  });

  const [products, setProducts] = useState<ProductFormData[]>(initialProducts);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(null);
  const [itemColorSuggestions, setItemColorSuggestions] = useState<
    { itemColor: string; imageSrc: string }[]
  >([]);

  // Fetch item color suggestions
  useEffect(() => {
    const fetchItemColorSuggestions = async () => {
      try {
        const response = await fetch('/api/trade-in/autocomplete');
        const data = await response.json();
        setItemColorSuggestions(data.itemColors || []);
      } catch (error) {
        console.error('Error fetching item color suggestions:', error);
      }
    };

    fetchItemColorSuggestions();
  }, []);

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

    if (products.length === 0) {
      alert('Debes agregar al menos un producto');
      return;
    }

    await onSubmit({ ...formData, products });
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

  return (
    <div className="space-y-8">
      {/* Products Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Productos</h2>
          <Button
            type="button"
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
              imageDetectionEnabled={false} // Disabled for store forms
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

      {/* Customer Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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

        {/* Client Comment */}
        <div className="mt-6">
          <label htmlFor="client_comment" className="block text-sm font-medium text-gray-700 mb-1">
            Historia del Producto
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Cuéntanos sobre la historia y experiencias con el producto
          </p>
          <textarea
            id="client_comment"
            rows={4}
            value={formData.client_comment}
            onChange={(e) => handleInputChange('client_comment', e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Aventuras, momentos especiales, lugares visitados..."
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || products.length === 0}
          className="px-8 py-3"
        >
          {isSubmitting ? 'Procesando...' : 'Recibir Trade-in'}
        </Button>
      </div>
    </div>
  );
}
