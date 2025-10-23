import Form from '@/app/ui/trade-in/create-form';
import Breadcrumbs from '@/app/ui/trade-in/breadcrumbs';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crear Producto | Trade-In',
};

export default async function Page() {
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Configuración', href: '/dashboard/trade-in/config' },
          {
            label: 'Crear Producto',
            href: '/dashboard/trade-in/config/create',
            active: true,
          },
        ]}
      />
      <Form />
    </main>
  );
}