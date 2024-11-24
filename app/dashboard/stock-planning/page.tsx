'use client';
import { useState } from 'react';
import Search from '@/app/ui/search';
import UploadSegmentation from '@/app/ui/stock-planning/upload-segmentation';
import SegmentationTable from '@/app/ui/stock-planning/segmentation-table';
import ReplenishmentsList from '@/app/ui/stock-planning/replenishments-list';
import { lusitana } from '@/app/ui/fonts';
import { Suspense } from 'react';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
import { useRouter } from 'next/navigation';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function Page({
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
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSegmentationCollapsed, setIsSegmentationCollapsed] = useState(true);

  const handleNewStockPlanning = () => {
    router.push('/dashboard/stock-planning/new');
  };

  const handleUploadComplete = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  return (
    <div className="w-full">
      {/* Main Title */}
      <h1 className={`${lusitana.className} text-3xl mb-6`}>Stock Planning</h1>

      {/* Actual segmentation */}
      <div className="mb-8">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsSegmentationCollapsed(!isSegmentationCollapsed)}
        >
          <h2 className={`${lusitana.className} text-2xl`}>
            {isSegmentationCollapsed ? (
              <ChevronRightIcon className="inline h-6 w-6 mr-2" />
            ) : (
              <ChevronDownIcon className="inline h-6 w-6 mr-2" />
            )}
            Segmentación Actual
          </h2>
          {!isSegmentationCollapsed && (
            <UploadSegmentation onUploadComplete={handleUploadComplete} />
          )}
        </div>

        {!isSegmentationCollapsed && (
          <>
            <div className="mt-4 flex items-center justify-between gap-2">
              <Search placeholder="Search SKU, DELIVERY..."/>
            </div>

            <Suspense
              key={query + currentPage + refreshKey}
              fallback={<InvoicesTableSkeleton />}
            >
              <SegmentationTable
                query={query}
                currentPage={currentPage}
                setPage={setCurrentPage}
              />
            </Suspense>
          </>
        )}
      </div>

      {/* Replenishments Section */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className={`${lusitana.className} text-2xl`}>Reposiciones</h2>
          <button
            onClick={handleNewStockPlanning}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Nuevo Stock Planning
          </button>
        </div>

        {/* Replenishments List */}
        <div className="mt-4">
          <ReplenishmentsList />
        </div>
      </div>
    </div>
  );
}
