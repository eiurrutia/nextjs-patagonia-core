import { 
  ClockIcon, 
  UserIcon,
  UserCircleIcon,
  DocumentTextIcon, 
  IdentificationIcon 
} from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import { useEffect, useState } from 'react';
import { Incidence } from '@/app/lib/definitions';
import { CardSkeleton } from '@/app/ui/skeletons';

export default function OpenedIncidencesCard({
  startDate,
  endDate,
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
      const response = await fetch(
        `/api/opened-incidences-card?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
      );
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
          {isVisible ? 'Ocultar' : 'Ver Más'}
        </button>
      </div>
      {isVisible && (
        <div className="space-y-4 px-4 py-2">
          {incidences.map((incidence) => (
            <div
              key={incidence.SUBORDER_ID}
              className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2 text-sm font-semibold">
                <IdentificationIcon className="h-5 w-5 text-gray-500" />
                <a
                  href={`https://patagonia.omni.pro/orders/${encodeURIComponent(incidence.SUBORDER_ID)}`}
                  className="text-blue-500 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {incidence.ECOMMERCE_NAME_CHILD}
                </a>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <UserIcon className="h-5 w-5 text-gray-500" />
                <a
                  href={`/dashboard/customers/${encodeURIComponent(incidence.PARTNER_VAT)}/detail`}
                  className="text-blue-500 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {incidence.PARTNER_NAME}
                </a>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                <p>{incidence.DESCRIPTION}</p>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <UserCircleIcon className="h-5 w-5 text-gray-500" />
                <p>{incidence.USER}</p>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <ClockIcon className="h-5 w-5 text-gray-500" />
                <p><strong>Fecha Creación:</strong> {incidence.INCIDENCE_CREATE_DATE}</p>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <ClockIcon className="h-5 w-5 text-gray-500" />
                <p><strong>Último Registro:</strong> {incidence.LAST_REGISTER_DATE}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
