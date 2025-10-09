'use client';

import Image from 'next/image';
import Link from 'next/link';
import { 
  TagIcon, 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  MapPinIcon,
  TruckIcon
} from '@heroicons/react/24/outline';

interface ProductDetailInfoProps {
  product: any;
}

export default function ProductDetailInfo({ product }: ProductDetailInfoProps) {
  // Función para obtener el estado del producto (prioriza el confirmado sobre el calculado)
  const getProductState = () => {
    const confirmedState = product.confirmed_calculated_state;
    const calculatedState = product.calculated_state;
    
    const state = confirmedState || calculatedState || 'Sin evaluar';
    
    const stateColors = {
      'Como Nuevo': 'bg-green-100 text-green-800',
      'Con detalles de uso': 'bg-blue-100 text-blue-800',
      'Reparado': 'bg-yellow-100 text-yellow-800',
      'Reciclado': 'bg-red-100 text-red-800',
      'excelente': 'bg-green-100 text-green-800',
      'bueno': 'bg-blue-100 text-blue-800',
      'regular': 'bg-yellow-100 text-yellow-800',
      'malo': 'bg-red-100 text-red-800',
      'Sin evaluar': 'bg-gray-100 text-gray-800'
    };
    
    const color = stateColors[state as keyof typeof stateColors] || 'bg-gray-100 text-gray-800';
    
    return (
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${color}`}>
          {state}
        </span>
        {confirmedState && (
          <span className="text-sm text-green-600">✓ Verificado en tienda</span>
        )}
      </div>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CL', {
      timeZone: 'America/Santiago',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  };

  const getDeliveryMethodText = () => {
    const { delivery_method, received_store_code, address, region, comuna } = product;
    
    if (delivery_method === 'shipping') {
      return 'Envío courier (BlueExpress / ChileExpress)';
    }
    
    if (delivery_method === 'pickup') {
      return `Retiro domicilio: ${address || `${comuna}, ${region}`}`;
    }
    
    if (delivery_method === 'store' && received_store_code) {
      return `Entrega en tienda: ${received_store_code}`;
    }
    
    return delivery_method || 'No especificado';
  };

  return (
    <div className="space-y-6">
      {/* Información básica del producto */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TagIcon className="h-5 w-5 text-gray-600" />
          Información del Producto
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Estilo</label>
            <p className="text-sm text-gray-900 font-mono">{product.product_style}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Talla</label>
            <p className="text-sm text-gray-900">{product.product_size}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Rango de Crédito</label>
            <p className="text-sm text-gray-900">{product.credit_range || 'No especificado'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Estado Evaluado</label>
            <div className="mt-1">
              {getProductState()}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Cumple Requisitos</label>
            <p className="text-sm text-gray-900">
              {product.confirmed_meets_minimum_requirements !== null 
                ? (product.confirmed_meets_minimum_requirements ? 'Sí' : 'No')
                : (product.meets_minimum_requirements ? 'Sí' : 'No')
              }
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Fecha de Ingreso</label>
            <p className="text-sm text-gray-900">{formatDate(product.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Información de la solicitud */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Información de la Solicitud</h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">N° Solicitud:</span>
            <Link 
              href={`/trade-in/${product.request_id}/detail`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {product.request_number}
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-900">
              {product.first_name} {product.last_name}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <EnvelopeIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-900">{product.email}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <PhoneIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-900">{product.phone}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <TruckIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-900">{getDeliveryMethodText()}</span>
          </div>
        </div>
      </div>

      {/* Imágenes del producto */}
      {product.product_images && product.product_images.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">
            Imágenes del Producto ({product.product_images.length})
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {product.product_images.map((imageUrl: string, index: number) => (
              <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={`${product.product_style} - Imagen ${index + 1}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detalles de condición */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Detalles de Condición</h2>
        
        <div className="space-y-3">
          {[
            { label: 'Señales de uso', confirmed: product.confirmed_usage_signs, original: product.usage_signs },
            { label: 'Nivel de pilling', confirmed: product.confirmed_pilling_level, original: product.pilling_level },
            { label: 'Manchas', confirmed: product.confirmed_stains_level, original: product.stains_level },
            { label: 'Rasgaduras y hoyos', confirmed: product.confirmed_tears_holes_level, original: product.tears_holes_level },
            { label: 'Reparaciones', confirmed: product.confirmed_repairs_level, original: product.repairs_level }
          ].map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">{item.label}:</span>
              <div className="text-right">
                <span className="text-sm text-gray-900">
                  {item.confirmed || item.original}
                </span>
                {item.confirmed && item.confirmed !== item.original && (
                  <div className="text-xs text-green-600">
                    ✓ Actualizado en tienda (era: {item.original})
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}