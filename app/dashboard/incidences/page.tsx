import Search from '@/app/ui/search';
import StatusFilter from '@/app/ui/status-filter';
import Table from '@/app/ui/incidences/table';
import { lusitana } from '@/app/ui/fonts';
import { Suspense } from 'react';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
 
export default async function Page({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
    status?: string;
  };
}) {
const query = searchParams?.query || '';
const currentPage = Number(searchParams?.page) || 1;
const status = searchParams?.status || 'all';

return (
  <div className="w-full">
    <div className="flex w-full items-center justify-between">
      <h1 className={`${lusitana.className} text-2xl`}>Incidencias</h1>
      <StatusFilter />
    </div>
    <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
      <Search placeholder="Search incidences..." />
    </div>
    <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton />}>
      <Table query={query} currentPage={currentPage} status={status}/>
    </Suspense>
  </div>
);
}