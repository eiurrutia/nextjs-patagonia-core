import { fetchZendeskTickets, fetchShopifyCustomersByRut } from '@/app/lib/customers/data';
import { ZendeskTicket } from '@/app/lib/definitions';
import { lusitana } from '@/app/ui/fonts';

interface TicketsData {
  [email: string]: ZendeskTicket[] | null; 
}


export default async function ShopifyInfoDetail({
    customer_id
}: {
    customer_id: string;
}) {
  const shopify_customers = await fetchShopifyCustomersByRut(customer_id);
  const ticketsData: TicketsData = {}; 
  for (const customer of shopify_customers) {
    console.log(customer);
    try {
      const tickets = await fetchZendeskTickets(customer.EMAIL);
      ticketsData[customer.EMAIL] = tickets || [];
    } catch (error) {
      console.error(`Error fetching Zendesk tickets for ${customer.EMAIL}:`, error);
      ticketsData[customer.EMAIL] = null;
    }
  }
  console.log('#### tickets data: ', ticketsData);
  return (
    <div className="shopify-info-section">
      {shopify_customers.length > 0 && (
        <div className="flex w-full items-center justify-between pt-10 pb-5">
          <h1 className={`${lusitana.className} text-2xl`}>Shopify Data</h1>
        </div>
      )}
      {shopify_customers.map((customer, index) => (
        <div key={index} className="shopify-info mt-4 p-4 bg-green-50 rounded-lg">
          <h4 className="text-lg font-semibold">Email: {customer.EMAIL}</h4>
          <h4 className="text-lg font-semibold">{customer.ORDERS_COUNT} órdenes</h4>
          <h5 className="text-lg font-semibold">Dirección más utilizada: {customer.MOST_REPEATED_ADDRESS1} - {customer.MOST_REPEATED_CITY} - {customer.MOST_REPEATED_PROVINCE}</h5>
          {ticketsData[customer.EMAIL] && (
            <h5 className="text-lg font-semibold">Zendesk Tickets: {ticketsData[customer.EMAIL]?.length || 'No tickets found'}</h5>
          )}
        </div>
      ))}
    </div>
  );
}
