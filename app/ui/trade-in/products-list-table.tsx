import { fetchTradeInProductsWithFilters } from '@/app/lib/trade-in/sql-data';
import { getStores } from '@/app/lib/stores/sql-data';
import { TagIcon, EyeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

// Interface for filters
interface TradeInFilters {
  requestNumber?: string;
  customer?: string;
  status?: string[];
  deliveryMethod?: string[];
  store?: string;
  dateFrom?: string;
  dateTo?: string;
  productStyle?: string;
  productState?: string;
}

const formatDate = (dateInput: string | Date | null) => {
  if (!dateInput) return 'N/A';
  
  // Convert to string if it's a Date object
  const dateString = dateInput instanceof Date ? dateInput.toISOString() : dateInput.toString();
  
  // Handle different date formats - now that SQL queries use AT TIME ZONE 'UTC',
  // dates should come as proper UTC ISO strings
  const utcDate = new Date(dateString);
    
  return new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(utcDate);
};

export default async function TradeInProductsListTable({
  filters,
  currentPage,
}: {
  filters: TradeInFilters;
  currentPage: number;
}) {
  const products = await fetchTradeInProductsWithFilters(filters, currentPage);
  const stores = await getStores();
  
  // Crear un mapa de códigos de tienda para obtener nombres
  const storeMap = new Map(stores.map(store => [store.code, store.name]));

  // Función para mostrar información de la bodega de recepción
  const getReceptionWarehouseText = (storeCode: string | null) => {
    if (!storeCode) {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-500">
          Pendiente
        </span>
      );
    }

    const storeName = storeMap.get(storeCode) || storeCode;
    
    return (
      <div className="text-sm">
        <div className="text-gray-800 text-xs">{storeCode}</div>
      </div>
    );
  };

  // Función para obtener el estado del producto (prioriza el confirmado sobre el calculado)
  const getProductState = (product: any) => {
    const confirmedState = product.confirmed_calculated_state;
    const calculatedState = product.calculated_state;
    
    const state = confirmedState || calculatedState || 'Sin evaluar';
    
    const stateColors = {
      'excelente': 'bg-green-100 text-green-800',
      'bueno': 'bg-blue-100 text-blue-800',
      'regular': 'bg-yellow-100 text-yellow-800',
      'malo': 'bg-red-100 text-red-800',
      'Sin evaluar': 'bg-gray-100 text-gray-800'
    };
    
    const color = stateColors[state as keyof typeof stateColors] || 'bg-gray-100 text-gray-800';
    
    return (
      <div className="text-sm">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
          {state}
        </span>
      </div>
    );
  };

  // Función para mostrar el estado operativo del producto
  const getOperationalStatusText = (status: string | null) => {
    if (!status) {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-500">
          Pendiente
        </span>
      );
    }

    const statusLabels: Record<string, { label: string; color: string }> = {
      'en_tienda': { label: 'En Tienda', color: 'bg-blue-100 text-blue-800' },
      'etiqueta_generada': { label: 'Etiqueta Generada', color: 'bg-indigo-100 text-indigo-800' },
      'empacado': { label: 'Empacado', color: 'bg-yellow-100 text-yellow-800' },
      'enviado': { label: 'Enviado', color: 'bg-green-100 text-green-800' }
    };
    
    const statusInfo = statusLabels[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  // Función para mostrar el proceso del producto
  const getProductProcess = (process: string | null) => {
    if (!process) {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-500">
          Pendiente
        </span>
      );
    }

    const processInfo: Record<string, { label: string; color: string; icon: string }> = {
      'IN': { label: 'Invendible', color: 'bg-red-100 text-red-800', icon: '🚫' },
      'LAV-REP': { label: 'Lav+Rep', color: 'bg-purple-100 text-purple-800', icon: '🧼🔧' },
      'REP': { label: 'Reparación', color: 'bg-yellow-100 text-yellow-800', icon: '🔧' },
      'LAV': { label: 'Lavado', color: 'bg-blue-100 text-blue-800', icon: '🧼' },
      'ETI': { label: 'Etiquetado', color: 'bg-green-100 text-green-800', icon: '🏷️' }
    };
    
    const info = processInfo[process] || { label: process, color: 'bg-gray-100 text-gray-800', icon: '📋' };
    
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${info.color}`}>
        <span className="text-xs">{info.icon}</span>
        <span>{info.label}</span>
      </span>
    );
  };

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <table className="min-w-full text-gray-900">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-3 py-5 font-medium">ID</th>
                <th scope="col" className="px-3 py-5 font-medium">SKU</th>
                <th scope="col" className="px-3 py-5 font-medium">Estilo</th>
                <th scope="col" className="px-3 py-5 font-medium">Bodega Recepción</th>
                <th scope="col" className="px-3 py-5 font-medium">N° Solicitud</th>
                <th scope="col" className="px-3 py-5 font-medium">Estado Producto</th>
                <th scope="col" className="px-3 py-5 font-medium">Proceso</th>
                <th scope="col" className="px-3 py-5 font-medium">Estado Operativo</th>
                <th scope="col" className="px-3 py-5 font-medium w-48">Fecha Ingreso</th>
                <th scope="col" className="px-3 py-5 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {products.map((product: any, index: number) => (
                <tr
                  key={product.id}
                  className="border-b last-of-type:border-none"
                >
                  <td className="px-3 py-3">
                    <div className="text-sm">
                      <Link 
                        href={`/trade-in/products/${product.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        #{product.id}
                      </Link>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {product.confirmed_sku ? (
                      <div className="text-sm font-mono">
                        <div className="font-medium text-gray-600">{product.confirmed_sku}</div>
                      </div>
                    ) : (
                      <div className="text-sm">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-500">
                          Pendiente
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {product.product_style}
                      </div>
                      <div className="text-gray-500">Talla: {product.product_size}</div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {getReceptionWarehouseText(product.product_received_store_code)}
                  </td>
                  <td className="px-3 py-3 font-medium">
                    <Link 
                      href={`/trade-in/${encodeURIComponent(product.request_id)}/detail`}
                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      {product.request_number}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    {getProductState(product)}
                  </td>
                  <td className="px-3 py-3">
                    {getProductProcess(product.process)}
                  </td>
                  <td className="px-3 py-3">
                    {getOperationalStatusText(product.product_status)}
                  </td>
                  <td className="px-3 py-3 w-48">
                    <div className="text-sm">
                      {formatDate(product.created_at)} hrs
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/trade-in/products/${product.id}`}>
                        <EyeIcon className="h-5 w-5 text-blue-500 hover:text-blue-600" title="Ver detalle del producto" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {products.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <TagIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No hay productos registrados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}