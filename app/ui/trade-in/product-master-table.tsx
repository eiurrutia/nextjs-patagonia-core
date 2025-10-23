import Image from 'next/image';
import { UpdateProduct, DeleteProduct } from '@/app/ui/trade-in/table-actions';
import { formatDateToLocal } from '@/app/lib/utils';
import { fetchFilteredProductMaster } from '@/app/lib/trade-in/product-master-data';

// Función específica para formatear pesos chilenos
const formatChileanPesos = (amount: number) => {
  return amount.toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
  });
};

export default async function ProductMasterTable({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {
  const products = await fetchFilteredProductMaster(query, currentPage);

  const getConditionBadge = (condition: string) => {
    const badges = {
      'CN': 'bg-green-100 text-green-800',
      'DU': 'bg-yellow-100 text-yellow-800', 
      'RP': 'bg-red-100 text-red-800'
    };
    
    const labels = {
      'CN': 'Como Nuevo',
      'DU': 'Detalles de Uso',
      'RP': 'Reparado'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[condition as keyof typeof badges]}`}>
        {labels[condition as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <div className="md:hidden">
            {products?.map((product) => (
              <div
                key={product.id}
                className="mb-2 w-full rounded-md bg-white p-4"
              >
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <div className="mb-2 flex items-center">
                      <p className="text-sm font-semibold">{product.style_code}</p>
                    </div>
                    <p className="text-sm text-gray-500">{product.product_name}</p>
                  </div>
                  {getConditionBadge(product.condition_state)}
                </div>
                <div className="flex w-full items-center justify-between pt-4">
                  <div>
                    <p className="text-xl font-medium">
                      {formatChileanPesos(product.credit_amount)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Actualizado: {formatDateToLocal(product.updated_at.toString())}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <UpdateProduct id={product.id} />
                    <DeleteProduct id={product.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  Código de Estilo
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Nombre del Producto
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Estado
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Crédito
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Actualizado
                </th>
                <th scope="col" className="relative py-3 pl-6 pr-3">
                  <span className="sr-only">Editar</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {products?.map((product) => (
                <tr
                  key={product.id}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{product.style_code}</p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {product.product_name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {getConditionBadge(product.condition_state)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {formatChileanPesos(product.credit_amount)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {formatDateToLocal(product.updated_at.toString())}
                  </td>
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex justify-end gap-3">
                      <UpdateProduct id={product.id} />
                      <DeleteProduct id={product.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}