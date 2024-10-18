import { fetchTradeInRecords } from '@/app/lib/trade-in/data';
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
  const records = await fetchTradeInRecords(query, currentPage);

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <table className="min-w-full text-gray-900">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-3 py-5 font-medium">Orden</th>
                <th scope="col" className="px-3 py-5 font-medium">Nombre</th>
                <th scope="col" className="px-3 py-5 font-medium">RUT</th>
                <th scope="col" className="px-3 py-5 font-medium">Email</th>
                <th scope="col" className="px-3 py-5 font-medium">Teléfono</th>
                <th scope="col" className="px-3 py-5 font-medium">Producto</th>
                <th scope="col" className="px-3 py-5 font-medium">Fecha</th>
                <th scope="col" className="px-3 py-5 font-medium">Estado</th>
                <th scope="col" className="px-3 py-5 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {records.map((record, index) => (
                <tr
                  key={index}
                  className="border-b last-of-type:border-none"
                >
                  <td className="px-3 py-3">{record.ID}</td>
                  <td className="px-3 py-3">{`${record.FIRST_NAME} ${record.LAST_NAME}`}</td>
                  <td className="px-3 py-3">{record.RUT}</td>
                  <td className="px-3 py-3">{record.EMAIL}</td>
                  <td className="px-3 py-3">{record.PHONE}</td>
                  <td className="px-3 py-3">{record.SELECTED_ITEM_COLOR}</td>
                  <td className="px-3 py-3">{formatDate(record.SNOWFLAKE_CREATED_AT)} hrs</td>
                  <td className="px-3 py-3">
                    <StatusIcons status={record.STATUS} />
                  </td>
                  <td className="px-3 py-3">
                    <Link href={`/trade-in/${encodeURIComponent(record.ID)}/detail`}>
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
