import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { deleteProductMaster } from '@/app/lib/trade-in/product-master-actions';

export function UpdateProduct({ id }: { id: number }) {
  return (
    <Link
      href={`/dashboard/trade-in/config/${id}/edit`}
      className="rounded-md border p-2 hover:bg-gray-100"
    >
      <PencilIcon className="w-5" />
    </Link>
  );
}

export function DeleteProduct({ id }: { id: number }) {
  return (
    <form
      action={async () => {
        'use server';
        await deleteProductMaster(id);
      }}
    >
      <button className="rounded-md border p-2 hover:bg-gray-100">
        <span className="sr-only">Eliminar</span>
        <TrashIcon className="w-5" />
      </button>
    </form>
  );
}