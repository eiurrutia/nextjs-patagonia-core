import { fetchSalesByCustomer } from '@/app/lib/customers/data';
import {
  BanknotesIcon,
  ClockIcon,
  UserGroupIcon,
  InboxIcon,
  WindowIcon,
  BuildingStorefrontIcon,
  HashtagIcon
} from '@heroicons/react/24/outline';
import { Order } from '@/app/lib/definitions';
import { lusitana } from '@/app/ui/fonts';

const iconMap = {
  collected: BanknotesIcon,
  time: ClockIcon,
  invoices: InboxIcon,
  ecommerce: WindowIcon,
  retail: BuildingStorefrontIcon,
  total: HashtagIcon
};


export function Card({
  title,
  value,
  type,
}: {
  title: string;
  value: number | string;
  type: 'invoices' | 'total' | 'time' | 'collected' | 'ecommerce' | 'retail';
}) {
  const Icon = iconMap[type];

  return (
    <div className="rounded-xl bg-gray-50 p-2 shadow-sm">
      <div className="flex p-4">
        {Icon ? <Icon className="h-5 w-5 text-gray-700" /> : null}
        <h3 className="ml-2 text-sm font-medium">{title}</h3>
      </div>
      <p
        className={`${lusitana.className}
          truncate rounded-xl bg-white px-4 py-8 text-center text-2xl`}
      >
        {value}
      </p>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string) {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('es-CL', options).replace(/\//g, '-');
}

function getMostFrequentChannel(orders: Order[]) {
  const frequency: { [key: string]: number } = {};

  orders.forEach(order => {
    if (order.CANAL !== 'Ecomerce') {
      frequency[order.CANAL] = (frequency[order.CANAL] || 0) + 1;
    }
  });

  let maxFrequency = 0;
  let mostFrequentChannel = null;

  Object.entries(frequency).forEach(([channel, freq]) => {
    if (freq > maxFrequency) {
      maxFrequency = freq;
      mostFrequentChannel = channel;
    }
  });

  return mostFrequentChannel;
}

export default async function CustomerGeneralStats({
  customer_id
}: {
  customer_id: string;
}) {
  
  const orders = await fetchSalesByCustomer(customer_id);

  const stats = {
    lastPurchaseDate: formatDate(new Date(Math.max(...orders.map(s => new Date(s.INVOICEDATE).getTime()))).toISOString()),
    averageTicket: formatCurrency(orders.reduce((sum, line) => sum + line.SALESPRICETOTAL, 0) / orders.length),
    ecommercePurchasesPercentage: orders.filter(line => line.CECO === 'Ecomerce').length/orders.length*100,
    storePurchasesPercentage: orders.filter(line => line.CECO === 'Retail').length/orders.length*100,
    totalPurchases: orders.length,
    oldestPurchaseDate: new Date(Math.min(...orders.map(s => new Date(s.INVOICEDATE).getTime()))).toISOString(),
    mostFrequentChannel: getMostFrequentChannel(orders) || 'None'
  };

  return (
    <div className="cards-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card title="Ticket Promedio" value={stats.averageTicket} type="collected" />
      <Card title="Última compra" value={stats.lastPurchaseDate} type="time" />
      <Card title="Tienda preferida" value={stats.mostFrequentChannel} type="retail" />
      <Card title="Total Purchases" value={stats.totalPurchases} type="total"/>
      <div className="col-span-1 lg:col-span-2 flex items-center">
        <div className="w-full h-20 relative">
          <div className="absolute inset-0 flex overflow-hidden">
            <div className={`${lusitana.className} flex font-bold text-lg items-center justify-end text-white px-2`}
                style={{
                  width: `${stats.ecommercePurchasesPercentage}%`,
                  backgroundColor: 'olivedrab',
                  borderRadius: stats.ecommercePurchasesPercentage === 100 ? '0.5rem' : '0.5rem 0 0 0.5rem'
                }}>
              {stats.ecommercePurchasesPercentage > 10 ? `Ecommerce ${stats.ecommercePurchasesPercentage.toFixed(0)}%` : ''} {/* El texto solo se muestra si hay suficiente espacio */}
            </div>
            <div className={`${lusitana.className} flex font-bold text-lg items-center justify-start text-white px-2`}
            style={{
              width: `${stats.storePurchasesPercentage}%`,
              backgroundColor: 'royalblue',
              borderRadius: stats.storePurchasesPercentage === 100 ? '0.5rem' : '0 0.5rem 0.5rem 0'
              }}>
              {stats.storePurchasesPercentage > 10 ? `Retail ${stats.storePurchasesPercentage.toFixed(0)}%` : ''} {/* Similar para el texto de retail */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
