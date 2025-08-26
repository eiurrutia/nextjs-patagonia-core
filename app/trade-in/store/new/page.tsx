'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { lusitana } from '@/app/ui/fonts';
import { Button } from '@/app/ui/button';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import TradeInStoreForm from '@/app/ui/trade-in/store-form';
import StoreSelect from '@/app/ui/stores/store-select';
import { TradeInFormData } from '@/app/lib/trade-in/form-types';
import { ProductFormData } from '@/app/ui/trade-in/products-table';

export default function StoreTradeInPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [stores, setStores] = useState<any[]>([]);

  // Fetch user store information if user is a store employee
  useEffect(() => {
    async function fetchUserStore() {
      if (session?.user?.role === 'store' && session?.user?.store_code) {
        setSelectedStore(session.user.store_code);
      } else if (session?.user?.role === 'admin') {
        try {
          const response = await fetch('/api/stores');
          if (response.ok) {
            const data = await response.json();
            setStores(data);
          }
        } catch (error) {
          console.error('Error fetching stores:', error);
        }
      }
    }

    if (session) {
      fetchUserStore();
    }
  }, [session]);

  // Redirect if not authenticated
  if (status === 'loading') {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-600">Cargando...</div>
    </div>;
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (data: TradeInFormData & { products: ProductFormData[] }) => {
    if (session?.user?.role === 'admin' && !selectedStore) {
      setError('Debes seleccionar una tienda donde se recibió el producto');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Define Store Code
      let storeCode = '';
      let storeName = '';
      
      if (session?.user?.role === 'store') {
        // User type 'store': use store code
        storeCode = session.user.store_code || 'STORE';
        storeName = session.user.store_name || 'Tienda Patagonia';
      } else if (session?.user?.role === 'admin' && selectedStore) {
        // User admin: use selected store
        const store = stores.find((s: any) => s.code === selectedStore);
        storeCode = selectedStore;
        storeName = store?.name || 'Tienda Patagonia';
      }

      const requestData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        region: 'Región Metropolitana',
        comuna: 'Las Condes',
        deliveryMethod: 'store',
        address: storeName,
        houseDetails: '',
        clientComment: data.client_comment,
        products: data.products,
        receivedStoreCode: storeCode // Agregar el código de tienda donde se recibió
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
      setSuccessMessage(`¡Solicitud recibida exitosamente! Número: ${result.requestNumber}`);
      
      // Reset form after successful submission and force refresh
      setTimeout(() => {
        // Force complete refresh by going to trade-in list
        window.location.href = '/trade-in';
      }, 2000);

    } catch (error) {
      console.error('Error submitting store trade-in:', error);
      setError(error instanceof Error ? error.message : 'Error al procesar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/trade-in');
  };

  if (successMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Recepción Exitosa!</h2>
          <p className="text-gray-600 mb-4">{successMessage}</p>
          <p className="text-sm text-gray-500">Redirigiendo en 2 segundos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`${lusitana.className} text-3xl font-bold text-gray-900 mb-2`}>
            Recepción Trade-in en Tienda
          </h1>
          <p className="text-gray-600">
            Registra una nueva solicitud trade-in recibida directamente en tienda
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Store Selection for Admin Users */}
        {session?.user?.role === 'admin' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de la Tienda</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tienda donde se recibe el producto <span className="text-red-500">*</span>
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
        <TradeInStoreForm
          mode="store-new"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
