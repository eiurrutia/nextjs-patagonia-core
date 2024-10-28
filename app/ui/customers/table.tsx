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

  return (
    <div className="mt-6 flow-root">
      <div className="relative overflow-x-auto rounded-lg bg-gray-50 p-2 md:pt-0">
        <table className="min-w-full text-gray-900">
          <thead className="hidden md:table-header-group">
            <tr>
              <th scope="col" className="px-4 py-5 font-medium sm:pl-6">Rut</th>
              <th scope="col" className="px-3 py-5 font-medium">Name</th>
              <th scope="col" className="px-3 py-5 font-medium">Email</th>
              <th scope="col" className="px-3 py-5 font-medium">Ver más</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {customers?.map((customer) => (
              <tr
                key={customer.CUSTOMERACCOUNT}
                className="md:table-row flex flex-col md:flex-row md:space-x-4 border-b py-3 text-sm"
              >
                <td className="whitespace-nowrap py-3 pl-6 pr-3">{customer.CUSTOMERACCOUNT}</td>
                <td className="whitespace-nowrap px-3 py-3">{customer.NAMEALIAS}</td>
                <td className="whitespace-nowrap px-3 py-3">{customer.PRIMARYCONTACTEMAIL}</td>
                <td className="whitespace-nowrap px-3 py-3">
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
  );
}

