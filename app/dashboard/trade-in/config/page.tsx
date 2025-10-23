import Pagination from '@/app/ui/trade-in/pagination';
import Search from '@/app/ui/search';
import Table from '@/app/ui/trade-in/product-master-table';
import { CSVUpload } from '@/app/ui/trade-in/csv-upload';
import { ProductMasterTableSkeleton } from '@/app/ui/skeletons';
import { Suspense } from 'react';
import { fetchProductMasterPages } from '@/app/lib/trade-in/product-master-data';
import { Metadata } from 'next';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Configuración Trade-In | Patagonia Core',
};

export default async function Page({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
  };
}) {
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;

  const totalPages = await fetchProductMasterPages(query);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-2xl font-bold">Configuración de Productos Trade-In</h1>
      </div>
      
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Buscar productos..." />
        <div className="flex flex-col gap-2">
          <Link
            href="/dashboard/trade-in/config/create"
            className="flex h-10 w-48 items-center justify-between rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <span className="hidden md:block">Crear Producto</span>
            <PlusIcon className="h-5" />
          </Link>
          <CSVUpload />
        </div>
      </div>
      
      <Suspense key={query + currentPage} fallback={<ProductMasterTableSkeleton />}>
        <Table query={query} currentPage={currentPage} />
      </Suspense>
      
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}