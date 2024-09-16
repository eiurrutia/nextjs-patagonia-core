import { ArrowPathIcon } from '@heroicons/react/24/outline';
import b2cIcon from '@/public/Icon_B2C.png';
import b2bIcon from '@/public/Icon_B2B.png';
import retailIcon from '@/public/Icon_PasilloInfinito.png';
import Link from 'next/link';
import Image from 'next/image';
import clsx from 'clsx';
import { fetchOrderByCustomerIdandDate } from '@/app/lib/orders/data';
import { lusitana } from '@/app/ui/fonts';

function formatCurrency(value: any) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}


export default async function CustomerOrders({
    customer_id,
    period
}: {
    customer_id: string;
    period: string;
}) {
  const customer_orders = await fetchOrderByCustomerIdandDate(customer_id, period)
  return (
    <div className="flex w-full flex-col pt-5 md:col-span-4">
      <div className="flex grow flex-col justify-between rounded-xl bg-gray-50 p-4">
        <div className="bg-white px-6">
          {customer_orders.map((order, i) => {
            return (
              <div
                key={order.SALESID}
                className={clsx(
                  'flex flex-row items-center justify-between py-4',
                  {
                    'border-t': i !== 0,
                  },
                )}
              >
                <Link href={`/dashboard/orders/${encodeURIComponent(order.SALESID)}/detail`}>                
                  <div className="flex items-center">
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
                        unoptimized={true}
                      />
                    <div className="min-w-0 pl-5">
                      <p className="truncate text-sm font-semibold md:text-base">
                        {order.SALESID}
                      </p>
                      <p className="hidden text-sm text-gray-500 sm:block">
                        {order.INVOICEDATE}
                      </p>
                      <p className="hidden text-sm text-gray-500 sm:block">
                        {order.CANAL}
                      </p>
                    </div>
                  </div>
                </Link>
                <p
                  className={`${lusitana.className} truncate text-sm font-medium md:text-base`}
                >
                  {formatCurrency(order.SALESPRICETOTAL)}
                </p>
              </div>
            );
          })}
        </div>
        <div className="flex items-center pb-2 pt-6">
          <ArrowPathIcon className="h-5 w-5 text-gray-500" />
          <h3 className="ml-2 text-sm text-gray-500 ">Updated just now</h3>
        </div>
      </div>
    </div>
  );
}
