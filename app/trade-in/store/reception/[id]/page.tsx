'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { lusitana } from '@/app/ui/fonts';
import { Button } from '@/app/ui/button';
import { CheckCircleIcon, ArrowLeftIcon, PencilIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import StoreReceptionForm from '@/app/ui/trade-in/store-reception-form';
import StoreSelect from '@/app/ui/stores/store-select';
import { TradeInFormData } from '@/app/lib/trade-in/form-types';
import { ProductFormData } from '@/app/ui/trade-in/products-table';
import Link from 'next/link';

interface TradeInRequest {
  id: string;
  firstName: string;
  lastName: string;
  rut: string;
  email: string;
  phone: string;
  region: string;
  comuna: string;
  address: string;
  houseDetails: string;
  client_comment: string;
  clientComment: string;
  deliveryMethod: string;
  status: string;
  products: ProductFormData[];
  receivedStoreCode?: string;
}

export default function StoreReceptionPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tradeInRequest, setTradeInRequest] = useState<TradeInRequest | null>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [deliveryMethod, setDeliveryMethod] = useState<string>('');
  const [isEditingDeliveryMethod, setIsEditingDeliveryMethod] = useState(false);

  // Delivery method labels
  const deliveryMethodLabels: Record<string, { title: string; description: string }> = {
    shipping: {
      title: 'Envíos por Chilexpress o Blue Express',
      description: 'Se envía etiqueta de despacho al cliente para enviar el producto.'
    },
    pickup: {
      title: 'Retiros a domicilio',
      description: 'Se coordina retiro del producto en el domicilio del cliente.'
    },
    store: {
      title: 'Entrega en tienda',
      description: 'El cliente lleva el producto directamente a una tienda.'
    }
  };

  const tradeInId = params?.id as string;

  // Fetch trade-in request data and stores
  useEffect(() => {
    const fetchData = async () => {
      if (!tradeInId) return;

      try {
        // Fetch trade-in request
        const response = await fetch(`/api/trade-in/requests/${tradeInId}`);
        if (!response.ok) {
          throw new Error('Error al cargar la solicitud');
        }
        
        const data = await response.json();
        // Map SQL snake_case fields to camelCase for React component
        const mappedData = {
          ...data,
          firstName: data.first_name,
          lastName: data.last_name,
          rut: data.rut,
          houseDetails: data.house_details,
          deliveryMethod: data.delivery_method,
          clientComment: data.client_comment,
          receivedStoreCode: data.received_store_code
        };
        setTradeInRequest(mappedData);

        // Fetch stores for admin users
        if (session?.user?.role === 'admin') {
          const storesResponse = await fetch('/api/stores');
          if (storesResponse.ok) {
            const storesResult = await storesResponse.json();
            setStores(storesResult.stores || []);
          }
          // Initialize selectedStore with saved value if exists
          if (data.received_store_code) {
            setSelectedStore(data.received_store_code);
          }
        } else if (session?.user?.role === 'store') {
          // For store users, set the selected store automatically
          setSelectedStore(session.user.store_code || '');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    if (session !== undefined) {
      fetchData();
    }
  }, [tradeInId, session]);

  // Auto-scroll to top when error state changes
  useEffect(() => {
    if (error) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error]);

  // Initialize delivery method from trade-in request
  useEffect(() => {
    if (tradeInRequest?.deliveryMethod) {
      setDeliveryMethod(tradeInRequest.deliveryMethod);
    }
  }, [tradeInRequest]);

  const handleSubmit = async (data: TradeInFormData & { 
    products: ProductFormData[];
    modifiedConditions?: any[];
    productRepairs?: any[];
  }) => {
    // Validate store selection for admin users
    if (session?.user?.role === 'admin' && !selectedStore) {
      setError('Debes seleccionar la tienda donde se está recibiendo la solicitud');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Determine store code and name
      let storeCode = '';
      let storeName = '';
      
      if (session?.user?.role === 'store') {
        storeCode = session.user.store_code || '';
        storeName = session.user.store_name || '';
      } else if (session?.user?.role === 'admin' && selectedStore) {
        const store = stores.find((s: any) => s.code === selectedStore);
        storeCode = selectedStore;
        storeName = store?.name || '';
      }

      const requestData = {
        id: tradeInId,
        firstName: data.firstName,
        lastName: data.lastName,
        rut: data.rut,
        email: data.email,
        phone: data.phone,
        region: data.region || tradeInRequest?.region,
        comuna: data.comuna || tradeInRequest?.comuna,
        address: data.address || tradeInRequest?.address,
        houseDetails: data.houseDetails || tradeInRequest?.houseDetails,
        client_comment: data.client_comment,
        deliveryMethod: data.deliveryMethod || tradeInRequest?.deliveryMethod || 'shipping', // Use updated delivery method
        products: data.products,
        status: 'recepcionado_tienda', // Mark as received in store
        receivedInStore: true,
        receivedStoreCode: storeCode, // Add store code where it was received
        originalDeliveryMethod: tradeInRequest?.deliveryMethod, // Keep original for reference
        modifiedConditions: data.modifiedConditions || [],
        productRepairs: data.productRepairs || []
      };

      const response = await fetch(`/api/trade-in/${tradeInId}/receive`, {
        method: 'PATCH', // Changed to PATCH to match the API endpoint
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al procesar la recepción');
      }

      const result = await response.json();
      setSuccessMessage(`Solicitud recibida exitosamente. ID: ${result.id}`);
      
      // Redirect after 2 seconds with router refresh to ensure data is updated
      setTimeout(() => {
        // Use window.location for a full page reload to ensure fresh data
        window.location.href = '/trade-in';
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Cargando solicitud...</div>
      </div>
    );
  }

  if (error && !tradeInRequest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <Link href="/trade-in">
            <Button>Volver a Trade-In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            ¡Recepción Exitosa!
          </h2>
          <p className="text-gray-600 mb-4">{successMessage}</p>
          <p className="text-sm text-gray-500">
            Redirigiendo automáticamente...
          </p>
        </div>
      </div>
    );
  }

  // Prepare initial data from the original request
  const initialData: Partial<TradeInFormData> = tradeInRequest ? {
    firstName: tradeInRequest.firstName,
    lastName: tradeInRequest.lastName,
    rut: tradeInRequest.rut,
    email: tradeInRequest.email,
    phone: tradeInRequest.phone,
    region: tradeInRequest.region,
    comuna: tradeInRequest.comuna,
    address: tradeInRequest.address,
    houseDetails: tradeInRequest.houseDetails,
    client_comment: tradeInRequest.clientComment,
    deliveryMethod: tradeInRequest?.deliveryMethod || 'shipping' // Keep original delivery method
  } : {};

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/trade-in">
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                <ArrowLeftIcon className="h-4 w-4" />
                Volver
              </button>
            </Link>
          </div>
          
          <h1 className={`${lusitana.className} text-3xl font-bold text-gray-900`}>
            Recepción de Solicitud Ecom
          </h1>
          <p className="text-gray-600 mt-2">
            Revisa y confirma los datos de la solicitud #{tradeInId}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Delivery Method Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Método de Entrega</h2>
            <button
              type="button"
              onClick={() => setIsEditingDeliveryMethod(!isEditingDeliveryMethod)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
              title={isEditingDeliveryMethod ? "Cancelar edición" : "Editar método de entrega"}
            >
              {isEditingDeliveryMethod ? (
                <XMarkIcon className="h-5 w-5" />
              ) : (
                <PencilIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="p-6">
            {isEditingDeliveryMethod ? (
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="shipping"
                    checked={deliveryMethod === 'shipping'}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-medium">Envíos por Chilexpress o Blue Express</span>
                    <p className="text-sm text-gray-500 mt-1">
                      Se envía etiqueta de despacho al cliente para enviar el producto.
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="pickup"
                    checked={deliveryMethod === 'pickup'}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-medium">Retiros a domicilio</span>
                    <p className="text-sm text-gray-500 mt-1">
                      Se coordina retiro del producto en el domicilio del cliente.
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="store"
                    checked={deliveryMethod === 'store'}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-medium">Entrega en tienda</span>
                    <p className="text-sm text-gray-500 mt-1">
                      El cliente lleva el producto directamente a una tienda.
                    </p>
                  </div>
                </label>
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsEditingDeliveryMethod(false)}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <CheckIcon className="h-4 w-4 inline mr-1" />
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  {deliveryMethod === 'shipping' && (
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  )}
                  {deliveryMethod === 'pickup' && (
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  )}
                  {deliveryMethod === 'store' && (
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  )}
                </div>
                <div>
                  <span className="font-medium text-gray-900">
                    {deliveryMethodLabels[deliveryMethod]?.title || 'No especificado'}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    {deliveryMethodLabels[deliveryMethod]?.description || ''}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Store Selection for Admin Users */}
        {session?.user?.role === 'admin' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de Recepción</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tienda donde se está recibiendo <span className="text-red-500">*</span>
              </label>
              <StoreSelect
                value={selectedStore}
                onChange={setSelectedStore}
                placeholder="Selecciona la tienda..."
              />
            </div>
          </div>
        )}

        {/* Store Info for Store Users */}
        {session?.user?.role === 'store' && session?.user?.store_name && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-blue-800 mb-1">Recibiendo en:</h3>
            <p className="text-blue-700 font-semibold">{session.user.store_name}</p>
            <p className="text-blue-600 text-sm">Código: {session.user.store_code}</p>
          </div>
        )}

        {/* Form */}
        <StoreReceptionForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          initialData={initialData}
          initialProducts={tradeInRequest?.products || []}
          tradeInId={tradeInId}
          deliveryMethod={deliveryMethod}
          storeCode={session?.user?.role === 'admin' 
            ? selectedStore 
            : session?.user?.store_code || ''}
          storeName={session?.user?.role === 'admin' 
            ? stores.find((s: any) => s.code === selectedStore)?.name || ''
            : session?.user?.store_name || ''}
        />
      </div>
    </div>
  );
}
