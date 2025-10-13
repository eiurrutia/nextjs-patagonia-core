import { fetchTradeInRequests } from '@/app/lib/trade-in/sql-data';
import { getStores } from '@/app/lib/stores/sql-data';
import { BuildingStorefrontIcon } from '@heroicons/react/24/solid';
import { TagIcon, EyeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

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
    
    // Fallback para casos no esperados
    return (
      <div className="text-sm">
        <div className="font-medium text-gray-600">{delivery_method}</div>
      </div>
    );
  };
  
  // Función para mostrar el estado de manera más amigable
  const getStatusText = (status: string) => {
    const statusLabels: Record<string, { label: string; color: string }> = {
      'solicitud_recibida': { label: 'Solicitud recibida', color: 'bg-blue-100 text-blue-800' },
      'etiqueta_enviada': { label: 'Etiqueta enviada', color: 'bg-indigo-100 text-indigo-800' },
      'recepcionado_tienda': { label: 'En tienda', color: 'bg-green-100 text-green-800' },
      'credito_entregado': { label: 'Crédito entregado', color: 'bg-yellow-100 text-yellow-800' },
      'factura_enviada': { label: 'Factura enviada', color: 'bg-purple-100 text-purple-800' },
      'enviado_vestua': { label: 'Enviado a Vestua', color: 'bg-gray-100 text-gray-800' },
      'pending': { label: 'Pendiente', color: 'bg-gray-100 text-gray-800' }
    };
    
    const statusInfo = statusLabels[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
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
                  <td className="px-3 py-3">{record.phone}</td>
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
                    {getStatusText(record.status)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/trade-in/${encodeURIComponent(record.id)}/detail`}>
                        <EyeIcon className="h-5 w-5 text-blue-500 hover:text-blue-600" title="Ver detalle" />
                      </Link>
                      {(record.status === 'solicitud_recibida' || 
                        (record.status === 'etiqueta_enviada' && record.delivery_method === 'shipping')) && (
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
