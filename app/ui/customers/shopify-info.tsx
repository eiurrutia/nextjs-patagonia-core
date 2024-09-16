import { fetchZendeskTickets, fetchShopifyCustomersByRut } from '@/app/lib/customers/data';
import { ZendeskTicket } from '@/app/lib/definitions';
import { lusitana } from '@/app/ui/fonts';
import zendeskIcon from '@/public/Icon_Zendesk.png';
import Link from 'next/link';
import Image from 'next/image';
import clsx from 'clsx';


export default async function ShopifyInfoDetail({
    customer_id
}: {
    customer_id: string;
}) {
  const shopify_customers = await fetchShopifyCustomersByRut(customer_id);
  const ticketsData: { [key: string]: ZendeskTicket[] } = {};
  for (const customer of shopify_customers) {
    try {
      const tickets = await fetchZendeskTickets(customer.EMAIL);
      ticketsData[customer.EMAIL] = tickets['results'] || [];
    } catch (error) {
      console.error(`Error fetching Zendesk tickets for ${customer.EMAIL}:`, error);
      ticketsData[customer.EMAIL] = [];
    }
  }
  return (
    <div className="shopify-info-section">
      {shopify_customers.length > 0 && (
        <div className="flex w-full items-center justify-between pt-10 pb-5">
          <h1 className={`${lusitana.className} text-2xl`}>Shopify & Zendesk Data</h1>
        </div>
      )}
      {shopify_customers.map((customer, index) => (
        <div key={index} className="shopify-info mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center w-full">
            <Link className='pl-5 text-green-500 ' href={`https://admin.shopify.com/store/patagoniachile/customers/${encodeURIComponent(customer.SHOPIFY_ID)}`}>
              <h4 className="text-lg font-semibold">{customer.EMAIL}</h4>
            </Link>
            <h5 className="text-base">{customer.ORDERS_COUNT} órdenes</h5>
            <h5 className="text-base">Dirección más utilizada: {customer.MOST_REPEATED_ADDRESS1} - {customer.MOST_REPEATED_CITY} - {customer.MOST_REPEATED_PROVINCE}</h5>
          </div>
          <div className='bg-white rounded-xl px-4 py-8'>
          {ticketsData[customer.EMAIL]?.length > 0 ? (
            <div>
            <h5 className="text-lg font-semibold">Zendesk Tickets: {ticketsData[customer.EMAIL].length} ticket(s)</h5>
            <h5> ID Usuario en Zendesk: 
            <Link className='pl-5 text-purple-600' href={`https://patagoniachile.zendesk.com/agent/users/${encodeURIComponent(ticketsData[customer.EMAIL][0]['requester_id'])}/requested_tickets`}>
              {ticketsData[customer.EMAIL][0]['requester_id']}
            </Link>
            </h5>
            </div>
          ) : (
            <h5 className="text-lg font-semibold">No tickets found</h5>
          )}
          {ticketsData[customer.EMAIL].map((ticket, idx) => (
            <div
              key={ticket.id}
              className={clsx(
                'flex flex-row items-center justify-between py-4 p-10',
                {
                  'border-t': idx !== 0,
                },
              )}
            >
            <Link href={`https://patagoniachile.zendesk.com/agent/tickets/${encodeURIComponent(ticket.id)}`}>
              <div className="flex items-center">
                  <Image
                    src={zendeskIcon}
                    alt="Sales Channel"
                    width={45}
                    height={45}
                    unoptimized={true}
                  />
                <div className="min-w-0 pl-5">
                  <p className="truncate text-sm font-semibold md:text-base">
                    {ticket.subject}
                  </p>
                  <p className="hidden text-sm text-gray-500 sm:block">
                    Creación: {ticket.created_at}
                  </p>
                  <p className="hidden text-sm text-gray-500 sm:block">
                    Última modificación: {ticket.updated_at}
                  </p>
                </div>
              </div>
            </Link>
            <p
              className={`${lusitana.className} truncate text-sm font-medium md:text-base`}
            >
              {ticket.status}
            </p>
          </div>      
          ))}
          </div>
          </div>
      ))}
    </div>
  );
}
