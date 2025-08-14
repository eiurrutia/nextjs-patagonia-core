import { ShoppingBagIcon, ClockIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import { useEffect, useState } from 'react';
import { Order } from '@/app/lib/definitions';
import { CardSkeleton } from '@/app/ui/skeletons';
import { formatDate } from '@/app/utils/dateUtils';

export default function InShopifyNoOmsDifferenceCard({
  startDate,
  endDate
}: {
  startDate: string;
  endDate: string;
}) {
  const Icon = ShoppingBagIcon;
  const [orders, setOrders] = useState<Order[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      const response = await fetch(
        `/api/in-shopify-no-oms-difference-card?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
      );
      const data = await response.json();
      setOrders(data);
      setLoading(false);
    }
    fetchOrders();
  }, [startDate, endDate]);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  if (loading) {
    return <CardSkeleton />;
  }

  return (
    <div className="rounded-xl bg-gray-50 p-2 shadow-sm">
      <div className="flex items-center p-4">
        {Icon && <Icon className="h-5 w-5 text-gray-700" />}
        <span className="mx-2 text-gray-500">|</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="mx-2">Shopify</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span className="ml-2">OMS</span>
      </div>
      <div className="px-4 py-4 text-center">
        <p
          className={`${lusitana.className}
            truncate rounded-xl bg-white px-4 py-8 text-center text-2xl`}
        >
          {orders.length}
        </p>
      </div>
      <div className="flex justify-end pt-4 px-4">
        <button
          onClick={toggleVisibility}
          className="bg-steelblue hover:bg-blue-300 text-white text-xs font-bold py-2 px-4 rounded"
        >
          {isVisible ? 'Ocultar' : 'Ver Más'}
        </button>
      </div>
      {isVisible && (
        <div className="space-y-4 px-4 py-2">
          {orders.map((order) => (
            <div
              key={order.ORDER_ID}
              className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-col space-y-2 relative"
            >
              <div className="absolute top-2 right-2">
              <a
                href={`https://admin.shopify.com/store/patagoniachile/orders/${encodeURIComponent(order.ORDER_ID)}`}
                className="text-green-500 hover:underline text-sm font-semibold"
                target="_blank"
                rel="noopener noreferrer"
              >
                Shopify
              </a>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <ShoppingBagIcon className="h-5 w-5 text-gray-500" />
                <span className="font-semibold">{order.NAME}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <EnvelopeIcon className="h-5 w-5 text-gray-500" />
                <span className="text-gray-500">{order.EMAIL}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <ClockIcon className="h-5 w-5 text-gray-500" />
                <span>{formatDate(order.CREATED_AT, true, true)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
