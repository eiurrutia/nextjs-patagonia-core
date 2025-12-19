'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  XMarkIcon,
  ChevronDownIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { useDebouncedCallback } from 'use-debounce';

// Status options for requests
const REQUEST_STATUS_OPTIONS = [
  { value: 'solicitud_recibida', label: 'Solicitud recibida' },
  { value: 'entregado_cliente', label: 'Entregado por cliente' },
  { value: 'recepcionado_tienda', label: 'Recepcionado en tienda' },
  { value: 'factura_enviada', label: 'Factura enviada' },
  { value: 'credito_entregado', label: 'Crédito entregado' },
];

// Status options for products
const PRODUCT_STATUS_OPTIONS = [
  { value: 'en_tienda', label: 'En Tienda' },
  { value: 'etiqueta_generada', label: 'Etiqueta Generada' },
  { value: 'empacado', label: 'Empacado' },
  { value: 'enviado', label: 'Enviado' },
];

// Delivery method options
const DELIVERY_METHOD_OPTIONS = [
  { value: 'shipping', label: '📦 Envío courier' },
  { value: 'pickup', label: '🏠 Retiro domicilio' },
  { value: 'store', label: '🏪 Entrega en tienda' },
];

interface Store {
  id: string;
  name: string;
  code: string;
}

interface AdvancedFiltersProps {
  activeTab: 'requests' | 'products';
  stores: Store[];
}

export default function AdvancedFilters({ activeTab, stores }: AdvancedFiltersProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  
  // Filter states
  const [isExpanded, setIsExpanded] = useState(false);
  const [requestNumber, setRequestNumber] = useState(searchParams?.get('requestNumber') || '');
  const [customer, setCustomer] = useState(searchParams?.get('customer') || '');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
    searchParams?.get('status')?.split(',').filter(Boolean) || []
  );
  const [selectedDeliveryMethods, setSelectedDeliveryMethods] = useState<string[]>(
    searchParams?.get('deliveryMethod')?.split(',').filter(Boolean) || []
  );
  const [selectedStore, setSelectedStore] = useState(searchParams?.get('store') || '');
  const [dateFrom, setDateFrom] = useState(searchParams?.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams?.get('dateTo') || '');
  
  // Product-specific filters
  const [productStyle, setProductStyle] = useState(searchParams?.get('productStyle') || '');
  const [productState, setProductState] = useState(searchParams?.get('productState') || '');
  
  // Dropdown states
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showDeliveryDropdown, setShowDeliveryDropdown] = useState(false);
  
  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (requestNumber) count++;
    if (customer) count++;
    if (selectedStatuses.length > 0) count++;
    if (selectedDeliveryMethods.length > 0) count++;
    if (selectedStore) count++;
    if (dateFrom || dateTo) count++;
    if (activeTab === 'products') {
      if (productStyle) count++;
      if (productState) count++;
    }
    return count;
  };

  // Apply filters to URL
  const applyFilters = useDebouncedCallback(() => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('page', '1');
    
    // Request number
    if (requestNumber) {
      params.set('requestNumber', requestNumber);
    } else {
      params.delete('requestNumber');
    }
    
    // Customer
    if (customer) {
      params.set('customer', customer);
    } else {
      params.delete('customer');
    }
    
    // Status
    if (selectedStatuses.length > 0) {
      params.set('status', selectedStatuses.join(','));
    } else {
      params.delete('status');
    }
    
    // Delivery method
    if (selectedDeliveryMethods.length > 0) {
      params.set('deliveryMethod', selectedDeliveryMethods.join(','));
    } else {
      params.delete('deliveryMethod');
    }
    
    // Store
    if (selectedStore) {
      params.set('store', selectedStore);
    } else {
      params.delete('store');
    }
    
    // Date range
    if (dateFrom) {
      params.set('dateFrom', dateFrom);
    } else {
      params.delete('dateFrom');
    }
    
    if (dateTo) {
      params.set('dateTo', dateTo);
    } else {
      params.delete('dateTo');
    }
    
    // Product-specific filters
    if (activeTab === 'products') {
      if (productStyle) {
        params.set('productStyle', productStyle);
      } else {
        params.delete('productStyle');
      }
      
      if (productState) {
        params.set('productState', productState);
      } else {
        params.delete('productState');
      }
    }
    
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  // Clear all filters
  const clearAllFilters = () => {
    setRequestNumber('');
    setCustomer('');
    setSelectedStatuses([]);
    setSelectedDeliveryMethods([]);
    setSelectedStore('');
    setDateFrom('');
    setDateTo('');
    setProductStyle('');
    setProductState('');
    
    const params = new URLSearchParams();
    params.set('page', '1');
    replace(`${pathname}?${params.toString()}`);
  };

  // Toggle status selection
  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  // Toggle delivery method selection
  const toggleDeliveryMethod = (method: string) => {
    setSelectedDeliveryMethods(prev => 
      prev.includes(method) 
        ? prev.filter(m => m !== method)
        : [...prev, method]
    );
  };

  // Apply filters when values change
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestNumber, customer, selectedStatuses, selectedDeliveryMethods, selectedStore, dateFrom, dateTo, productStyle, productState]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.status-dropdown') && !target.closest('.delivery-dropdown')) {
        setShowStatusDropdown(false);
        setShowDeliveryDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statusOptions = activeTab === 'requests' ? REQUEST_STATUS_OPTIONS : PRODUCT_STATUS_OPTIONS;
  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-4">
      {/* Filter Header - Always visible */}
      <div 
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-700">Filtros</span>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearAllFilters();
              }}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <XMarkIcon className="h-4 w-4" />
              Limpiar
            </button>
          )}
          <ChevronDownIcon 
            className={`h-5 w-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>

      {/* Expandable Filter Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
            
            {/* Request Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                N° Solicitud
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={requestNumber}
                  onChange={(e) => setRequestNumber(e.target.value)}
                  placeholder="Ej: TI-2024-0001"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Customer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="Nombre, email o RUT"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Status Multi-select */}
            <div className="status-dropdown relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown);
                  setShowDeliveryDropdown(false);
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-left bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 flex items-center justify-between"
              >
                <span className={selectedStatuses.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
                  {selectedStatuses.length === 0 
                    ? 'Seleccionar estados' 
                    : `${selectedStatuses.length} seleccionado${selectedStatuses.length > 1 ? 's' : ''}`
                  }
                </span>
                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              </button>
              
              {showStatusDropdown && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {statusOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(option.value)}
                        onChange={() => toggleStatus(option.value)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Delivery Method Multi-select - Only for requests */}
            {activeTab === 'requests' && (
              <div className="delivery-dropdown relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método de Entrega
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeliveryDropdown(!showDeliveryDropdown);
                    setShowStatusDropdown(false);
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-left bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 flex items-center justify-between"
                >
                  <span className={selectedDeliveryMethods.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
                    {selectedDeliveryMethods.length === 0 
                      ? 'Seleccionar métodos' 
                      : `${selectedDeliveryMethods.length} seleccionado${selectedDeliveryMethods.length > 1 ? 's' : ''}`
                    }
                  </span>
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                </button>
                
                {showDeliveryDropdown && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                    {DELIVERY_METHOD_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDeliveryMethods.includes(option.value)}
                          onChange={() => toggleDeliveryMethod(option.value)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Store Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tienda Recepción
              </label>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Todas las tiendas</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.code}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Desde
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Hasta
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Product-specific filters */}
            {activeTab === 'products' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estilo Producto
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={productStyle}
                      onChange={(e) => setProductStyle(e.target.value)}
                      placeholder="Ej: 27045"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado Producto
                  </label>
                  <select
                    value={productState}
                    onChange={(e) => setProductState(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Todos los estados</option>
                    <option value="Como Nuevo">Como Nuevo</option>
                    <option value="Desgaste de Uso">Desgaste de Uso</option>
                    <option value="Reparable">Reparable</option>
                    <option value="Reciclado">Reciclado</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Active Filters Tags */}
          {activeFilterCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-2">
                {requestNumber && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                    N° Solicitud: {requestNumber}
                    <button onClick={() => setRequestNumber('')} className="hover:text-blue-900">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {customer && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                    Cliente: {customer}
                    <button onClick={() => setCustomer('')} className="hover:text-blue-900">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedStatuses.map(status => {
                  const statusLabel = statusOptions.find(s => s.value === status)?.label || status;
                  return (
                    <span key={status} className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs">
                      {statusLabel}
                      <button onClick={() => toggleStatus(status)} className="hover:text-green-900">
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
                {selectedDeliveryMethods.map(method => {
                  const methodLabel = DELIVERY_METHOD_OPTIONS.find(m => m.value === method)?.label || method;
                  return (
                    <span key={method} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs">
                      {methodLabel}
                      <button onClick={() => toggleDeliveryMethod(method)} className="hover:text-purple-900">
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
                {selectedStore && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded-md text-xs">
                    Tienda: {stores.find(s => s.code === selectedStore)?.name || selectedStore}
                    <button onClick={() => setSelectedStore('')} className="hover:text-orange-900">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {(dateFrom || dateTo) && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 rounded-md text-xs">
                    Fecha: {dateFrom || '...'} - {dateTo || '...'}
                    <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="hover:text-yellow-900">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {activeTab === 'products' && productStyle && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs">
                    Estilo: {productStyle}
                    <button onClick={() => setProductStyle('')} className="hover:text-indigo-900">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {activeTab === 'products' && productState && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-pink-50 text-pink-700 rounded-md text-xs">
                    Estado: {productState}
                    <button onClick={() => setProductState('')} className="hover:text-pink-900">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
