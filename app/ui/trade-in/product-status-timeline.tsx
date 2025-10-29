'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ClockIcon,
  BuildingStorefrontIcon,
  TagIcon,
  ArchiveBoxIcon,
  TruckIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import { updateProductStatus } from '@/app/lib/trade-in/sql-data';
import LabelPreviewModal from './label-preview-modal';

interface ProductStatusTimelineProps {
  product: any;
  onStatusChange?: (newStatus: 'en_tienda' | 'etiqueta_generada' | 'empacado' | 'enviado') => void;
  onLabelGenerated?: (pdfBlobUrl: string) => void;
}

interface StatusStep {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  completedAt: string | null;
  isCompleted: boolean;
  isCurrent: boolean;
  canUpdate: boolean;
}

export default function ProductStatusTimeline({ product, onStatusChange, onLabelGenerated }: ProductStatusTimelineProps) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [showLabelPreview, setShowLabelPreview] = useState(false);
  const [labelGenerated, setLabelGenerated] = useState(false);
  const [productName, setProductName] = useState<string>('Patagonia');

  // Obtener el nombre del producto desde la tabla maestra
  useEffect(() => {
    const fetchProductName = async () => {
      if (!product.product_style) return;
      
      try {
        // Extraer el código de estilo (antes del guion)
        const styleCode = product.product_style.split('-')[0];
        
        // Llamar a la API para obtener el nombre del producto
        const response = await fetch(`/api/trade-in/product-name?styleCode=${styleCode}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.productName) {
            setProductName(data.productName);
          }
        }
      } catch (error) {
        console.error('Error fetching product name:', error);
        // Mantener el valor por defecto 'Patagonia' en caso de error
      }
    };

    fetchProductName();
  }, [product.product_style]);

  const formatDate = (dateInput: string | Date | null) => {
    if (!dateInput) return null;
    
    try {
      // Convert to string if it's a Date object
      const dateString = dateInput instanceof Date ? dateInput.toISOString() : dateInput.toString();
      
      // Create date object
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date received:', dateInput);
        return null;
      }
      
      return new Intl.DateTimeFormat('es-CL', {
        timeZone: 'America/Santiago',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', dateInput, error);
      return null;
    }
  };

  const getStatusSteps = (): StatusStep[] => {
    const currentStatus = product.product_status;
    
    // Determine completion status based on current status and progression
    const statusOrder = ['en_tienda', 'etiqueta_generada', 'empacado', 'enviado'];
    const currentIndex = currentStatus ? statusOrder.indexOf(currentStatus) : -1;
    
    const steps = [
      {
        id: 'en_tienda',
        name: 'En Tienda',
        description: 'Producto recibido en tienda',
        icon: BuildingStorefrontIcon,
        completedAt: currentIndex >= 0 ? product.updated_at : null,
        isCompleted: currentIndex >= 0,
        isCurrent: currentStatus === 'en_tienda',
        canUpdate: currentIndex < 0 // Can update if not started
      },
      {
        id: 'etiqueta_generada',
        name: 'Etiqueta Generada',
        description: 'Etiqueta del producto generada',
        icon: TagIcon,
        completedAt: currentIndex >= 1 ? product.updated_at : null,
        isCompleted: currentIndex >= 1,
        isCurrent: currentStatus === 'etiqueta_generada',
        canUpdate: currentIndex === 0 // Can update if current is en_tienda
      },
      {
        id: 'empacado',
        name: 'Empacado',
        description: 'Producto empacado y listo',
        icon: ArchiveBoxIcon,
        completedAt: currentIndex >= 2 ? product.updated_at : null,
        isCompleted: currentIndex >= 2,
        isCurrent: currentStatus === 'empacado',
        canUpdate: currentIndex === 1 // Can update if current is etiqueta_generada
      },
      {
        id: 'enviado',
        name: 'Enviado',
        description: 'Producto enviado a destino',
        icon: TruckIcon,
        completedAt: currentIndex >= 3 ? product.updated_at : null,
        isCompleted: currentIndex >= 3,
        isCurrent: currentStatus === 'enviado',
        canUpdate: currentIndex === 2 // Can update if current is empacado
      }
    ];

    return steps;
  };

  const handleStatusUpdate = async (stepId: string) => {
    if (isUpdating) return;
    
    setIsUpdating(stepId);
    
    try {
      const response = await fetch(`/api/trade-in/products/${product.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: stepId
        }),
      });
      
      if (response.ok) {
        // Update local state immediately
        onStatusChange?.(stepId as 'en_tienda' | 'etiqueta_generada' | 'empacado' | 'enviado');
      } else {
        console.error('Error updating status, response not ok');
        alert('Error al actualizar el estado');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado');
    } finally {
      setIsUpdating(null);
    }
  };

  const statusSteps = getStatusSteps();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold mb-6">Estado del Producto</h2>
      
      <div className="flow-root">
        <ul className="-mb-8">
          {statusSteps.map((step, stepIdx) => (
            <li key={step.id}>
              <div className="relative pb-8">
                {stepIdx !== statusSteps.length - 1 ? (
                  <span
                    className={`absolute left-4 top-4 -ml-px h-full w-0.5 ${
                      step.isCompleted ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    aria-hidden="true"
                  />
                ) : null}
                
                <div className="relative flex space-x-3">
                  <div className="relative z-10">
                    {step.isCompleted ? (
                      <CheckCircleIcon
                        className="h-8 w-8 text-blue-600 bg-white rounded-full"
                        aria-hidden="true"
                      />
                    ) : step.isCurrent ? (
                      <ClockIcon
                        className="h-8 w-8 text-blue-600 bg-white rounded-full"
                        aria-hidden="true"
                      />
                    ) : (
                      <step.icon
                        className="h-8 w-8 text-gray-400 bg-white rounded-full"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className={`text-sm font-medium ${
                        step.isCompleted ? 'text-blue-900' : 
                        step.isCurrent ? 'text-blue-900' : 'text-gray-500'
                      }`}>
                        {step.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {step.description}
                      </p>
                      {step.completedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(step.completedAt)}
                        </p>
                      )}
                    </div>
                    
                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                      {/* Ocultar botón "Marcar como completado" para etiqueta_generada */}
                      {step.canUpdate && step.id !== 'etiqueta_generada' && (
                        <button
                          onClick={() => handleStatusUpdate(step.id)}
                          disabled={isUpdating === step.id}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdating === step.id ? 'Actualizando...' : 'Marcar como completado'}
                        </button>
                      )}
                      
                      {/* Botón Generar Etiqueta - solo cuando está ACTUALMENTE en en_tienda */}
                      {step.id === 'en_tienda' && step.isCompleted && step.isCurrent && product.confirmed_sku && !labelGenerated && (
                        <button
                          onClick={() => setShowLabelPreview(true)}
                          className="inline-flex items-center px-3 py-1.5 ml-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <PrinterIcon className="h-4 w-4 mr-1" />
                          Generar Etiqueta
                        </button>
                      )}

                      {/* Indicador de etiqueta generada */}
                      {step.id === 'en_tienda' && step.isCompleted && product.confirmed_sku && labelGenerated && (
                        <span className="inline-flex items-center px-2.5 py-0.5 ml-2 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Etiqueta generada
                        </span>
                      )}
                      
                      {step.isCurrent && !step.isCompleted && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          En proceso
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Información adicional */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          <p><strong>Estado actual:</strong> {product.product_status || 'Pendiente'}</p>
          {product.confirmed_sku && (
            <p className="mt-1"><strong>SKU:</strong> <span className="font-mono">{product.confirmed_sku}</span></p>
          )}
        </div>
      </div>

      {/* Modal de vista previa de etiqueta */}
      <LabelPreviewModal
        isOpen={showLabelPreview}
        onClose={() => setShowLabelPreview(false)}
        sku={product.confirmed_sku || product.id}
        productId={product.id}
        description={productName}
        onLabelGenerated={async (pdfBlobUrl: string) => {
          setLabelGenerated(true);
          
          // Actualizar automáticamente el estado a "etiqueta_generada"
          try {
            const response = await fetch(`/api/trade-in/products/${product.id}/status`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                status: 'etiqueta_generada'
              }),
            });
            
            if (response.ok) {
              // Notificar el cambio de estado
              onStatusChange?.('etiqueta_generada');
            } else {
              console.error('Error updating status after label generation');
            }
          } catch (error) {
            console.error('Error updating status:', error);
          }
          
          // Notificar al componente padre sobre la etiqueta generada
          onLabelGenerated?.(pdfBlobUrl);
        }}
      />
    </div>
  );
}