import Breadcrumbs from '@/app/ui/customers/breadcrumbs';
import IncidenceDetail from '@/app/ui/incidences/detail';
import { Suspense } from 'react';
import { CardSkeleton } from '@/app/ui/skeletons';

export default function IncidenceDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <div className="w-full">
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Incidencias', href: '/dashboard/incidences' },
          { label: `Incidencia ${id}`, href: `/dashboard/incidences/${id}/detail`, active: true },
        ]}
      />

      <div className="flex flex-col gap-10">
        {/* Incidence Detail */}
        <Suspense fallback={<CardSkeleton />}>
          <IncidenceDetail id={id} />
        </Suspense>
      </div>
    </div>
  );
}
