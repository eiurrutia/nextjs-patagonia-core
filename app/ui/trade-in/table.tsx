import { fetchTradeInRequests } from '@/app/lib/trade-in/sql-data';
import { getStores } from '@/app/lib/stores/sql-data';
import { PlusIcon, BuildingStorefrontIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import StatusIcons from '@/app/ui/trade-in/status-icons';

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
  
  // Crear un conjunto de códigos de tienda para verificación rápida
  const storeCodes = new Set(stores.map(store => store.code));
  
  // Función para determinar el texto del método de entrega
  const getDeliveryMethodText = (deliveryMethod: string) => {
    if (deliveryMethod === 'shipping') return 'Envío';
    if (deliveryMethod === 'pickup') return 'Retiro';
    if (storeCodes.has(deliveryMethod) || deliveryMethod === 'store') {
      return `Tienda: ${deliveryMethod}`;
    }
    return deliveryMethod;
  };

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <table className="min-w-full text-gray-900">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-3 py-5 font-medium">N° Solicitud</th>
                <th scope="col" className="px-3 py-5 font-medium">Nombre</th>
                <th scope="col" className="px-3 py-5 font-medium">Email</th>
                <th scope="col" className="px-3 py-5 font-medium">Teléfono</th>
                <th scope="col" className="px-3 py-5 font-medium">Región</th>
                <th scope="col" className="px-3 py-5 font-medium">Comuna</th>
                <th scope="col" className="px-3 py-5 font-medium">N° Productos</th>
                <th scope="col" className="px-3 py-5 font-medium">Método Entrega</th>
                <th scope="col" className="px-3 py-5 font-medium">Fecha</th>
                <th scope="col" className="px-3 py-5 font-medium">Estado</th>
                <th scope="col" className="px-3 py-5 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {records.map((record: any, index: number) => (
                <tr
                  key={record.id}
                  className="border-b last-of-type:border-none"
                >
                  <td className="px-3 py-3 font-medium text-blue-600">{record.request_number}</td>
                  <td className="px-3 py-3">{`${record.first_name} ${record.last_name}`}</td>
                  <td className="px-3 py-3">{record.email}</td>
                  <td className="px-3 py-3">{record.phone}</td>
                  <td className="px-3 py-3">{record.region || 'N/A'}</td>
                  <td className="px-3 py-3">{record.comuna || 'N/A'}</td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {record.productCount} producto{record.productCount !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-sm text-gray-600">
                      {getDeliveryMethodText(record.delivery_method)}
                    </span>
                  </td>
                  <td className="px-3 py-3">{formatDate(record.created_at)} hrs</td>
                  <td className="px-3 py-3">
                    <StatusIcons status={record.status} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/trade-in/${encodeURIComponent(record.id)}/detail`}>
                        <PlusIcon className="h-5 w-5 text-blue-500 hover:text-blue-600" title="Ver detalle" />
                      </Link>
                      {record.status === 'pending' && record.delivery_method !== 'store' && (
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
