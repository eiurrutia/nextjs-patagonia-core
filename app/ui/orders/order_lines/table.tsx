import { fetchOrderById, fetchOrderLinesById, fetchOrderTrackingInfo } from '@/app/lib/orders/data';
import { lusitana } from '@/app/ui/fonts';

import { useState, useEffect } from 'react';
import { OrderLine } from '@/app/lib/definitions';
import { PlusIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';


export default async function OrderLinesTable({
  sale_id
}: {
  sale_id: string;
}) {
  const orders = await fetchOrderById(sale_id);
  const order_lines = await fetchOrderLinesById(sale_id);

  const trackingPromises = order_lines
    .filter((line) => line.EXTERNALITEMID)
    .map((line) => {
      console.log('Consultara el external: ', line.EXTERNALITEMID); 
      return fetchOrderTrackingInfo(line.EXTERNALITEMID)
        .then((trackingInfo) => {
          if (
            trackingInfo && 
            typeof trackingInfo === 'object' && 
            'data' in trackingInfo &&
            trackingInfo.data &&
            typeof trackingInfo.data === 'object' &&
            'status' in trackingInfo.data &&
            trackingInfo.data.status &&
            typeof trackingInfo.data.status === 'object' &&
            'code' in trackingInfo.data.status &&
            trackingInfo.data.status.code
          ) {
            line.TRACKINGINFO = String(trackingInfo.data.status.code);
          } else {
            // Manejar el caso donde la estructura de la respuesta no es la esperada
            console.log('La respuesta de la API no tiene la estructura esperada', trackingInfo);
            line.TRACKINGINFO = 'UNKNOWN';
          }
        })
        .catch((error) => {
          console.error('Error fetching tracking info for line', line.LINENUM, error);
          // Decide cómo manejar los errores, por ejemplo, puedes querer asignar null
          line.TRACKINGINFO = 'UNKNOWN';
        });
    });

  // Espera a que todas las solicitudes de seguimiento se resuelvan
  await Promise.all(trackingPromises);

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="flex w-full items-center justify-between pt-10 pb-10">
          <h1 className={`${lusitana.className} text-2xl`}>Items</h1>
        </div>
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  SKU
                </th>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  Nombre
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Cantidad
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Precio
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Descuento
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Suborden
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Bodega Origen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {order_lines?.map((line) => (
                <tr
                  key={line.LINENUM}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    {line.SKU}
                  </td>
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    {line.ITEMNAME}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {line.QTY}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {line.SALESPRICE}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {line.SUMLINEDISC}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {line.EXTERNALITEMID}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {line.INVENTLOCATIONID}
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
