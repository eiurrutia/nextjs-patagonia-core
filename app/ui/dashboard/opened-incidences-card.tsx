import { ClockIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import { useEffect, useState } from 'react';
import { Incidence } from '@/app/lib/definitions';
import { CardSkeleton } from '@/app/ui/skeletons';

export default function OpenedIncidencesCard({
  startDate,
  endDate
}: {
  startDate: string;
  endDate: string;
}) {
  const Icon = ClockIcon;
  const [incidences, setIncidences] = useState<Incidence[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchIncidences() {
      setLoading(true);
      const response = await fetch(`/api/opened-incidences-card?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);
      const data = await response.json();
      setIncidences(data);
      setLoading(false);
    }
    fetchIncidences();
  }, [startDate, endDate]);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  if (loading) {
    return <CardSkeleton />;
  }

  return (
    <div className="rounded-xl bg-gray-50 p-2 shadow-sm">
      <div className="flex p-4">
        {Icon ? <Icon className="h-5 w-5 text-gray-700" /> : null}
        <h3 className="ml-2 text-sm font-medium">Incidencias OMS Abiertas</h3>
      </div>
      <div className="px-4 py-4 text-center">
        <p
          className={`${lusitana.className}
            truncate rounded-xl bg-white px-4 py-8 text-center text-2xl`}
        >
          {incidences.length}
        </p>
      </div>
      <div className="flex justify-end pt-4 px-4">
        <button
            onClick={toggleVisibility}
            className="bg-steelblue hover:bg-blue-300 text-white text-xs font-bold py-2 px-4 rounded"
          >
            {isVisible ? 'Ocultar' : 'Ver Mas'}
        </button>
      </div>
      {isVisible && (
        <div className="px-4 py-2">
          <ul className="list-disc">
            <p>Números de orden hija:</p>
            {incidences.map((incidence, index) => (
              <li key={index} className="text-gray-700 text-sm">
                <a href={`https://patagonia.omni.pro/orders/${encodeURIComponent(incidence.SUBORDER_ID)}`}
                          className="text-blue-500 hover:text-blue-600 underline"
                          target="_blank" rel="noopener noreferrer">
                  {incidence.ECOMMERCE_NAME_CHILD}
                </a>
                -
                <a href={`/dashboard/customers/${encodeURIComponent(incidence.PARTNER_VAT)}/detail`}
                          className="text-blue-500 hover:text-blue-600 underline"
                          target="_blank" rel="noopener noreferrer">
                  {incidence.PARTNER_NAME}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
    
  );
}
