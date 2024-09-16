import { fetchOrderById } from '@/app/lib/orders/data';


export default async function OrderDetail({
  sale_id
}: {
  sale_id: string;
}) {
  
  const orders = await fetchOrderById(sale_id);
  const order = orders[0];
  console.log('### Order detail');
  console.log(order);


  return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h1 className="text-2xl font-bold mb-4">{order.SALESID}</h1>
        <div className="flex flex-wrap -mx-3">
          <div className="w-full md:w-1/3 px-3 mb-6">
            <h2 className="text-lg font-semibold">Canal</h2>
            <p>{order.CANAL}</p>
          </div>
          {order.CANAL === 'Ecomerce' && (
            <div className="w-full md:w-1/3 px-3 mb-6">
              <h2 className="text-lg font-semibold">Shopify Number</h2>
              <p>{order.ORDERNUMBER}</p>
            </div>
          )}
          <div className="w-full md:w-1/3 px-3 mb-6">
            <h2 className="text-lg font-semibold">Invoice Date</h2>
            <p>{order.INVOICEDATE}</p>
          </div>
          <div className="w-full md:w-1/3 px-3 mb-6">
            <h2 className="text-lg font-semibold">Customer Id</h2>
            <p>{order.CUSTOMERACCOUNT}</p>
          </div>
          <div className="w-full md:w-1/3 px-3 mb-6">
            <h2 className="text-lg font-semibold">Customer Name</h2>
            <p>{order.ORGANIZATIONNAME}</p>
          </div>
          <div className="w-full md:w-1/3 px-3 mb-6">
            <h2 className="text-lg font-semibold">Total Sales Price</h2>
            <p>{order.SALESPRICETOTAL}</p>
          </div>
        </div>
      </div>
  );
}
