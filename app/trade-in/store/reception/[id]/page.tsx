'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { lusitana } from '@/app/ui/fonts';
import { Button } from '@/app/ui/button';
import { CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
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
          clientComment: data.client_comment
        };
        setTradeInRequest(mappedData);

        // Fetch stores for admin users
        if (session?.user?.role === 'admin') {
          const storesResponse = await fetch('/api/stores');
          if (storesResponse.ok) {
            const storesResult = await storesResponse.json();
            setStores(storesResult.stores || []);
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
        deliveryMethod: tradeInRequest?.deliveryMethod || 'shipping', // Keep original delivery method
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
        />
      </div>
    </div>
  );
}
