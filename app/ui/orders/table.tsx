import b2cIcon from '@/public/Icon_B2C.png';
import b2bIcon from '@/public/Icon_B2B.png';
import retailIcon from '@/public/Icon_PasilloInfinito.png';
import Image from 'next/image';
import { fetchFilteredOrders } from '@/app/lib/orders/data';
import { PlusIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

export default async function CustomersTable({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {
  const orders = await fetchFilteredOrders(query, currentPage);
  return (
    <div className="mt-6 flow-root">
      <div className="relative overflow-x-auto rounded-lg bg-gray-50 p-2 md:pt-0">
        <table className="min-w-full text-gray-900">
          <thead className="rounded-lg text-left text-sm font-normal">
            <tr className="hidden md:table-row">
              <th className="px-3 py-5 font-medium"></th>
              <th className="px-4 py-5 font-medium sm:pl-6">PAT</th>
              <th className="px-4 py-5 font-medium sm:pl-6">Orden</th>
              <th className="px-3 py-5 font-medium">Canal</th>
              <th className="px-3 py-5 font-medium">Rut</th>
              <th className="px-3 py-5 font-medium">Nombre</th>
              <th className="px-3 py-5 font-medium">Fecha</th>
              <th className="px-3 py-5 font-medium">Monto</th>
              <th className="px-3 py-5 font-medium"></th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {orders?.map((order) => (
              <tr
                key={order.SALESID}
                className="w-full border-b py-3 text-sm last-of-type:border-none md:table-row flex flex-col md:flex-row md:space-x-4"
              >
                <td className="whitespace-nowrap px-3 py-3">
                  <Image
                    src={
                      order.CANAL === 'Ecomerce'
                        ? b2cIcon
                        : order.CANAL === 'WholeSale'
                        ? b2bIcon
                        : retailIcon
                    }
                    alt="Sales Channel"
                    width={45}
                    height={45}
                    unoptimized
                  />
                </td>
                <td className="whitespace-nowrap py-3 text-base pl-6 pr-3">
                  {order.SALESID}
                </td>
                <td className="whitespace-nowrap py-3 text-base pl-6 pr-3">
                  {order.ORDERNUMBER}
                </td>
                <td className="whitespace-nowrap py-3 text-base pl-6 pr-3">
                  {order.CANAL}
                </td>
                <td className="whitespace-nowrap text-base px-3 py-3">
                  {order.CUSTOMERACCOUNT}
                </td>
                <td className="whitespace-nowrap text-base px-3 py-3">
                  {order.ORGANIZATIONNAME}
                </td>
                <td className="whitespace-nowrap text-base px-3 py-3">
                  {order.INVOICEDATE}
                </td>
                <td className="whitespace-nowrap text-base px-3 py-3">
                  {order.SALESPRICETOTAL}
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  {order.CANAL === 'Ecomerce' && (
                    <div className="flex gap-4">
                      <a
                        href={`https://patagonia.omni.pro/orders/esaleorder/${encodeURIComponent(
                          order.OMS_ID
                        )}`}
                        className="text-blue-500 hover:text-blue-600"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        OMS
                      </a>
                      <a
                        href={`https://admin.shopify.com/store/patagoniachile/orders/${encodeURIComponent(
                          order.SHOPIFY_ID
                        )}`}
                        className="text-blue-500 hover:text-blue-600"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Shopify
                      </a>
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  <Link href={`orders/${encodeURIComponent(order.SALESID)}/detail`}>
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