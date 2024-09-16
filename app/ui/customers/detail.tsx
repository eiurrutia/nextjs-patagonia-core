import { fetchERPCustomerById } from '@/app/lib/customers/data';
import { PlusIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

export default async function CustomerDetail({
  customer_id
}: {
  customer_id: string;
}) {
  
  const customers = await fetchERPCustomerById(customer_id);
  const customer = customers[0];
  return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h1 className="text-2xl font-bold mb-4">{customer.CUSTOMERACCOUNT}</h1>
        <div className="flex flex-wrap -mx-3">
          <div className="w-full md:w-1/3 px-3 mb-6">
            <h2 className="text-lg font-semibold">Nombre</h2>
            <p>{customer.NAMEALIAS}</p>
          </div>
          <div className="w-full md:w-1/3 px-3 mb-6">
            <h2 className="text-lg font-semibold">Tipo</h2>
            <p>{customer.CUSTOMERGROUPID}</p>
          </div>
          <div className="w-full md:w-1/3 px-3 mb-6">
            <h2 className="text-lg font-semibold">Email ERP</h2>
            <p>{customer.PRIMARYCONTACTEMAIL}</p>
          </div>
        </div>
      </div>
  );
}
