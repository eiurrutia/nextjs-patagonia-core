'use client';
import Search from '@/app/ui/search';
import UploadSegmentation from '@/app/ui/stock-planning/upload-segmentation';
import SegmentationTable from '@/app/ui/stock-planning/segmentation-table';
import { lusitana } from '@/app/ui/fonts';
import { Suspense } from 'react';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
import { useRouter } from 'next/navigation';

export default async function Page({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
    status?: string;
  };
}) {
  const router = useRouter();
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;

  const handleNewStockPlanning = () => {
    router.push('/dashboard/stock-planning/new');
  };

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Segmentación Actual</h1>
        <div className="flex gap-4">
          <UploadSegmentation />
          <button
            onClick={handleNewStockPlanning}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Nuevo Stock Planning
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search sku..." />
      </div>

      <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton />}>
        <SegmentationTable query={query} currentPage={currentPage} />
      </Suspense>
    </div>
  );
}
