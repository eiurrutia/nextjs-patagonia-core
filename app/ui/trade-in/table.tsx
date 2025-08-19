import { fetchTradeInRequests } from '@/app/lib/trade-in/sql-data';
import { PlusIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import StatusIcons from '@/app/ui/trade-in/status-icons';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

export default async function TradeInTable({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {
  const records = await fetchTradeInRequests(query, currentPage);

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
                <th scope="col" className="px-3 py-5 font-medium">Detalle</th>
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
                      {record.delivery_method === 'shipping' ? 'Envío' : 'Retiro'}
                    </span>
                  </td>
                  <td className="px-3 py-3">{formatDate(record.created_at)} hrs</td>
                  <td className="px-3 py-3">
                    <StatusIcons status={record.status} />
                  </td>
                  <td className="px-3 py-3">
                    <Link href={`/trade-in/${encodeURIComponent(record.id)}/detail`}>
                      <PlusIcon className="h-5 w-5 text-blue-500 hover:text-blue-600" />
                    </Link>
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
