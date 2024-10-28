import { fetchFilteredIncidences } from '@/app/lib/incidences/data';
import { PlusIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

export default async function IncidencesTable({
  query,
  currentPage,
  status,
}: {
  query: string;
  currentPage: number;
  status: string;
}) {
  const incidences = await fetchFilteredIncidences(query, currentPage, status);

  return (
    <div className="mt-6 flow-root">
      <div className="relative overflow-x-auto rounded-lg bg-gray-50 p-2 md:pt-0">
        <table className="min-w-full text-gray-900">
          <thead className="hidden md:table-header-group">
            <tr>
              <th scope="col" className="px-4 py-5 font-medium sm:pl-6">SubOrden</th>
              <th scope="col" className="px-4 py-5 font-medium">Tienda entrega</th>
              <th scope="col" className="px-4 py-5 font-medium">Transferencias</th>
              <th scope="col" className="px-3 py-5 font-medium">Tipo</th>
              <th scope="col" className="px-3 py-5 font-medium">Descripción</th>
              <th scope="col" className="px-3 py-5 font-medium">Usuario</th>
              <th scope="col" className="px-3 py-5 font-medium">Creación</th>
              <th scope="col" className="px-3 py-5 font-medium">Última Modificación</th>
              <th scope="col" className="px-3 py-5 font-medium">Estado</th>
              <th scope="col" className="px-3 py-5 font-medium"></th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {incidences?.map((incidence) => (
              <tr
                key={incidence.ECOMMERCE_NAME_CHILD}
                className="md:table-row flex flex-col md:flex-row md:space-x-4 border-b py-3 text-sm"
              >
                <td className="whitespace-nowrap font-bold text-blue-900 px-3 py-3">
                  <Link href={`https://patagonia.omni.pro/orders/${encodeURIComponent(incidence.SUBORDER_ID)}`}>
                    {incidence.ECOMMERCE_NAME_CHILD}
                  </Link>
                </td>
                <td className="whitespace-nowrap py-3 pl-6 pr-3">{incidence.WAREHOUSE}</td>
                <td className="whitespace-wrap py-3 pl-6 pr-3">{incidence.TRANSFER_WAREHOUSE}</td>
                <td className="whitespace-nowrap py-3 pl-6 pr-3">{incidence.NAME}</td>
                <td className="whitespace-wrap py-3 pl-6 pr-3">{incidence.DESCRIPTION}</td>
                <td className="whitespace-nowrap px-3 py-3">{incidence.USER}</td>
                <td className="whitespace-nowrap px-3 py-3">{incidence.INCIDENCE_CREATE_DATE}</td>
                <td className="whitespace-nowrap px-3 py-3">{incidence.LAST_REGISTER_DATE}</td>
                <td className="whitespace-wrap px-3 py-3">{incidence.STATE}</td>
                <td className="whitespace-nowrap px-3 py-3">
                  <Link href={`incidences/${encodeURIComponent(incidence.ECOMMERCE_NAME_CHILD)}/detail`}>
                    <PlusIcon className="h-5 w-5 text-blue-500 hover:text-blue-600" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
