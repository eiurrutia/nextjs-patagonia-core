import { fetchTradeInRequests } from '@/app/lib/trade-in/sql-data';
import { getStores } from '@/app/lib/stores/sql-data';
import { BuildingStorefrontIcon } from '@heroicons/react/24/solid';
import { TagIcon, EyeIcon } from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon, 
  InboxArrowDownIcon, 
  ReceiptRefundIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/solid';
import { BuildingStorefrontIcon as BuildingStorefrontSolidIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

// Status types matching status-display.tsx
type TradeInStatus = 
  | 'solicitud_recibida'
  | 'entregado_cliente'
  | 'recepcionado_tienda'
  | 'factura_enviada'
  | 'credito_entregado';

type DeliveryMethod = 'shipping' | 'pickup' | 'store';

// Status flow for shipping/pickup
const shippingPickupFlow: TradeInStatus[] = [
  'solicitud_recibida',
  'entregado_cliente',
  'recepcionado_tienda',
  'factura_enviada',
  'credito_entregado'
];

// Status flow for store deliveries
const storeFlow: TradeInStatus[] = [
  'solicitud_recibida',
  'recepcionado_tienda',
  'factura_enviada',
  'credito_entregado'
];

// Status configurations
const statusConfigs: Record<TradeInStatus, { label: string; color: string }> = {
  solicitud_recibida: { label: 'Solicitud recibida', color: 'text-blue-500' },
  entregado_cliente: { label: 'Entregado por cliente', color: 'text-indigo-500' },
  recepcionado_tienda: { label: 'Recepcionado en tienda', color: 'text-green-500' },
  factura_enviada: { label: 'Factura enviada', color: 'text-purple-500' },
  credito_entregado: { label: 'Crédito entregado', color: 'text-yellow-500' }
};

// Get icon for each status
const getStatusIcon = (status: TradeInStatus, isActive: boolean, size: string = 'h-5 w-5') => {
  const colorClass = isActive ? statusConfigs[status].color : 'text-gray-300';
  
  switch (status) {
    case 'solicitud_recibida':
      return <CheckCircleIcon className={`${size} ${colorClass}`} />;
    case 'entregado_cliente':
      return <InboxArrowDownIcon className={`${size} ${colorClass}`} />;
    case 'recepcionado_tienda':
      return <BuildingStorefrontSolidIcon className={`${size} ${colorClass}`} />;
    case 'factura_enviada':
      return <DocumentCheckIcon className={`${size} ${colorClass}`} />;
    case 'credito_entregado':
      return <ReceiptRefundIcon className={`${size} ${colorClass}`} />;
    default:
      return <CheckCircleIcon className={`${size} ${colorClass}`} />;
  }
};

// Get status flow based on delivery method
const getStatusFlow = (deliveryMethod: DeliveryMethod): TradeInStatus[] => {
  return deliveryMethod === 'store' ? storeFlow : shippingPickupFlow;
};

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

// Format phone number for display
const formatPhoneDisplay = (phone: string | null): string => {
  if (!phone) return 'N/A';
  
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Chilean format: +56 9 XXXX XXXX
  if (cleaned.startsWith('+569') && cleaned.length === 12) {
    return `+56 9 ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`;
  }
  
  // Chilean format without +: 569XXXXXXXX
  if (cleaned.startsWith('569') && cleaned.length === 11) {
    return `+56 9 ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  }
  
  // Other international formats: try to add spaces
  if (cleaned.startsWith('+') && cleaned.length > 8) {
    // Generic international: +XX XXXX XXXX
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  }
  
  // Return as-is if no pattern matches
  return phone;
};

export default async function TradeInTable({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {
  const records = await fetchTradeInRequests(query, currentPage);
  const stores = await getStores();
  
  // Crear un mapa de códigos de tienda para obtener nombres
  const storeMap = new Map(stores.map(store => [store.code, store.name]));
  
  // Función para determinar el texto del método de entrega
  const getDeliveryMethodText = (record: any) => {
    const { delivery_method, received_store_code, address, region, comuna } = record;
    
    if (delivery_method === 'shipping') {
      return (
        <div className="text-sm">
          <div className="font-medium text-blue-600">📦 Envío courier</div>
          <div className="text-gray-500 text-xs">BlueExpress / ChileExpress</div>
        </div>
      );
    }
    
    if (delivery_method === 'pickup') {
      return (
        <div className="text-sm">
          <div className="font-medium text-green-600">🏠 Retiro domicilio</div>
          <div className="text-gray-500 text-xs truncate" title={address}>
            {address ? `${address.slice(0, 30)}${address.length > 30 ? '...' : ''}` : `${comuna}, ${region}`}
          </div>
        </div>
      );
    }
    
    if (delivery_method === 'store' && received_store_code) {
      const storeName = storeMap.get(received_store_code);
      return (
        <div className="text-sm">
          <div className="font-medium text-orange-600">🏪 Entrega en tienda</div>
          <div className="text-gray-500 text-xs">
            {storeName || received_store_code}
          </div>
        </div>
      );
    }
    
    if (delivery_method === 'store' && !received_store_code) {
      return (
        <div className="text-sm">
          <div className="font-medium text-orange-600">🏪 Entrega en tienda</div>
          <div className="text-yellow-600 text-xs font-medium">
            Pendiente de entrega
          </div>
        </div>
      );
    }
    
    // Fallback para casos no esperados
    return (
      <div className="text-sm">
        <div className="font-medium text-gray-600">{delivery_method}</div>
      </div>
    );
  };
  
  // Función para mostrar los estados como íconos en fila horizontal
  const getStatusIcons = (record: any) => {
    const currentStatus = record.status as TradeInStatus;
    const deliveryMethod = record.delivery_method as DeliveryMethod;
    const statusFlow = getStatusFlow(deliveryMethod);
    const currentIndex = statusFlow.indexOf(currentStatus);
    
    return (
      <div className="flex items-center justify-center">
        {statusFlow.map((status, index) => {
          const isActive = index <= currentIndex;
          const config = statusConfigs[status];
          
          return (
            <div key={status} className="flex items-center">
              {/* Status icon with tooltip */}
              <div 
                className="relative group cursor-pointer"
                title={config.label}
              >
                {getStatusIcon(status, isActive)}
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                  {config.label}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                </div>
              </div>
              {/* Connector line between icons */}
              {index < statusFlow.length - 1 && (
                <div 
                  className={`w-3 h-0.5 ${
                    index < currentIndex ? 'bg-sky-500/50' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <table className="min-w-full text-gray-900">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-3 py-5 font-medium">N° Solicitud</th>
                <th scope="col" className="px-3 py-5 font-medium">Cliente</th>
                <th scope="col" className="px-3 py-5 font-medium">Teléfono</th>
                <th scope="col" className="px-3 py-5 font-medium">N° Productos</th>
                <th scope="col" className="px-3 py-5 font-medium">Método Entrega</th>
                <th scope="col" className="px-3 py-5 font-medium w-48">Fecha Solicitud</th>
                <th scope="col" className="px-3 py-5 font-medium text-center">Estado</th>
                <th scope="col" className="px-3 py-5 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {records.map((record: any, index: number) => (
                <tr
                  key={record.id}
                  className="border-b last-of-type:border-none"
                >
                  <td className="px-3 py-3 font-medium">
                    <Link 
                      href={`/trade-in/${encodeURIComponent(record.id)}/detail`}
                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      {record.request_number}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{`${record.first_name} ${record.last_name}`}</div>
                      <div className="text-gray-500">{record.email}</div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs text-gray-700">{formatPhoneDisplay(record.phone)}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {record.productCount}
                      <TagIcon className="h-3 w-3" />
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {getDeliveryMethodText(record)}
                  </td>
                  <td className="px-3 py-3 w-48">
                    <div className="text-sm">
                      {formatDate(record.created_at)} hrs
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {getStatusIcons(record)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/trade-in/${encodeURIComponent(record.id)}/detail`}>
                        <EyeIcon className="h-5 w-5 text-blue-500 hover:text-blue-600" title="Ver detalle" />
                      </Link>
                      {(record.status === 'solicitud_recibida' || 
                        record.status === 'entregado_cliente') && (
                        <Link href={`/trade-in/store/reception/${encodeURIComponent(record.id)}`}>
                          <BuildingStorefrontIcon className="h-5 w-5 text-green-500 hover:text-green-600" title="Recibir en tienda" />
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
