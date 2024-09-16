import { fetchFilteredERPCustomers } from '@/app/lib/customers/data';
import { PlusIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

export default async function CustomersTable({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {
  
  const customers = await fetchFilteredERPCustomers(query, currentPage);
  console.log('### Customers');
  console.log(customers);

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  Rut
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Name
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Email
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Ver más
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {customers?.map((customer) => (
                <tr
                  key={customer.CUSTOMERACCOUNT}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    {customer.CUSTOMERACCOUNT}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {customer.NAMEALIAS}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {customer.PRIMARYCONTACTEMAIL}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {/* Botón que lleva a la página de detalle de la orden del cliente */}
                    <Link href={`customers/${encodeURIComponent(customer.CUSTOMERACCOUNT)}/detail`}>
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
