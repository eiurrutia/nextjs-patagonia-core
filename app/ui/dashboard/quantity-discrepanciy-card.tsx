import { ArrowUpOnSquareIcon, ClockIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import { useEffect, useState } from 'react';
import { CardSkeleton } from '@/app/ui/skeletons';
import { formatDate } from '@/app/utils/dateUtils';

export default function QuantityDiscrepancyCard({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const [discrepancies, setDiscrepancies] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDiscrepancies() {
      setLoading(true);
      const response = await fetch(
        `/api/quantity-discrepancy-card?startDate=${encodeURIComponent(
          startDate
        )}&endDate=${encodeURIComponent(endDate)}`
      );
      const data = await response.json();
      setDiscrepancies(data);
      setLoading(false);
    }
    fetchDiscrepancies();
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
        <ArrowUpOnSquareIcon className="h-5 w-5 text-gray-700" />
        <span className="ml-2 text-sm font-medium">Discrepancias de Cantidad</span>
      </div>
      <div className="px-4 py-4 text-center">
        <p
          className={`${lusitana.className}
            truncate rounded-xl bg-white px-4 py-8 text-center text-2xl`}
        >
          {discrepancies.length}
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
          {discrepancies.map((item) => (
            <div
                key={item.ORDER_ID}
                className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-col space-y-2 relative"
            >
                <div className="absolute top-2 right-2 flex space-x-2">
                {item.OMS_ORDER_ID && (
                    <a
                    href={`https://patagonia.omni.pro/orders/esaleorder/${encodeURIComponent(item.OMS_ORDER_ID)}`}
                    className="text-blue-500 hover:underline text-sm font-semibold"
                    target="_blank"
                    rel="noopener noreferrer"
                    >
                    OMS
                    </a>
                )}
                {item.ORDER_ID && (
                    <a
                    href={`https://admin.shopify.com/store/patagoniachile/orders/${encodeURIComponent(item.ORDER_ID)}`}
                    className="text-green-500 hover:underline text-sm font-semibold"
                    target="_blank"
                    rel="noopener noreferrer"
                    >
                    Shopify
                    </a>
                )}
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-700">
                <ArrowUpOnSquareIcon className="h-5 w-5 text-gray-500" />
                <span className="font-semibold">{item.ORDER_NAME}</span>
                </div>
                <div className="text-sm text-gray-700">
                Shopify: <span className="text-green-500 font-bold">{item.TOTAL_QUANTITY_SHOPIFY}</span> | ERP: <span className="text-red-500 font-bold">{item.TOTAL_QUANTITY_ERP}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                <ClockIcon className="h-5 w-5 text-gray-500" />
                <span>{formatDate(item.CREATED_AT, true, true)}</span>
                </div>
            </div>
            ))}

        </div>
      )}
    </div>
  );
}
