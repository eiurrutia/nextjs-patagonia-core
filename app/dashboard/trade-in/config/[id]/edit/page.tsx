import Form from '@/app/ui/trade-in/edit-form';
import Breadcrumbs from '@/app/ui/trade-in/breadcrumbs';
import { fetchProductMasterById } from '@/app/lib/trade-in/product-master-data';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Editar Producto | Trade-In',
};

export default async function Page({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const [product] = await Promise.all([
    fetchProductMasterById(id),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Configuración', href: '/dashboard/trade-in/config' },
          {
            label: 'Editar Producto',
            href: `/dashboard/trade-in/config/${id}/edit`,
            active: true,
          },
        ]}
      />
      <Form product={product} />
    </main>
  );
}