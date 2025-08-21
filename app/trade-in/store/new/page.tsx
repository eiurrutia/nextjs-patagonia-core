'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { lusitana } from '@/app/ui/fonts';
import { Button } from '@/app/ui/button';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import TradeInStoreForm from '@/app/ui/trade-in/store-form';
import { TradeInFormData } from '@/app/lib/trade-in/form-types';
import { ProductFormData } from '@/app/ui/trade-in/products-table';

export default function StoreTradeInPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    setIsSubmitting(true);
    setError(null);

    try {
      const requestData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        region: 'Región Metropolitana', // Default store region
        comuna: 'Las Condes', // Default store comuna
        deliveryMethod: 'store', // Always store for in-store reception
        address: 'Tienda Patagonia', // Store address
        houseDetails: '',
        clientComment: data.client_comment,
        products: data.products,
        receivedInStore: true // Flag to indicate this was received directly in store
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
      
      // Reset form after successful submission
      setTimeout(() => {
        router.push('/trade-in');
      }, 3000);

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
          <p className="text-sm text-gray-500">Serás redirigido automáticamente...</p>
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
