import { fetchOrderLinesById, fetchOrderTrackingInfo } from '@/app/lib/orders/data';
import { lusitana } from '@/app/ui/fonts';

interface TrackingStatus {
  name: string;
  created_at: string;
}

interface ShippingAddress {
  full_address: string;
  place: string;
}

interface TrackingInfo {
  status: TrackingStatus;
  shipping_address: ShippingAddress;
  carrier: string;
}

interface TrackingResults {
  [externalItemId: string]: TrackingInfo;
}

export default async function TrackingInfoDetail({
  sale_id
}: {
  sale_id: string;
}) {
  const order_lines = await fetchOrderLinesById(sale_id);

  const uniqueExternalItemIds = new Set(order_lines.map(line => line.EXTERNALITEMID));

  const trackingResults: TrackingResults = {}; // Definir el tipo de trackingResults
  const trackingPromises = Array.from(new Set(order_lines.map(line => line.EXTERNALITEMID)))
    .filter(externalItemId => externalItemId)
    .map(async (externalItemId) => {
      try {
        const trackingInfo = await fetchOrderTrackingInfo(externalItemId);
        if (trackingInfo && typeof trackingInfo === 'object' && 'data' in trackingInfo && trackingInfo.data) {
          trackingResults[externalItemId!] = trackingInfo.data as TrackingInfo;
        }
      } catch (error) {
        console.error('Error fetching tracking info for externalItemId', externalItemId, error);
      }
    });

await Promise.all(trackingPromises);

function getStatusColor(status: string) {
  switch (status) {
    case 'Entregado':
      return 'green';
    case 'En camino':
      return 'orange';
    case 'Pendiente':
      return 'red';
    default:
      return 'gray';
  }
}

  return (
    <div className="tracking-info-section">
      {Object.keys(trackingResults).length > 0 && (
        <div className="flex w-full items-center justify-between pt-10 pb-5">
          <h1 className={`${lusitana.className} text-2xl`}>Tracking Details</h1>
        </div>
      )}
      {Object.entries(trackingResults).map(([externalItemId, trackingInfo], index) => (
        <div key={index} className="tracking-info mt-4 p-4 bg-orange-100 rounded-lg">
          <h4 className="text-lg font-semibold">{externalItemId}</h4>
          <div className="flex flex-wrap -mx-2 pt-5">
            <div className="w-full md:w-1/2 px-3 mb-6">
              <h2 className="text-lg font-semibold">Status</h2>
              <div className="flex items-center">
                <div className="status-indicator ml-2" style={{
                  backgroundColor: getStatusColor(trackingInfo.status.name),
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%'
                }} />
                <p className="ml-2">{trackingInfo.status.name}</p>
              </div>
            </div>
            <div className="w-full md:w-1/2 px-3 mb-6">
              <h2 className="text-lg font-semibold">Date</h2>
              <p>{trackingInfo.status.created_at}</p>
            </div>
          </div>
          <div className="flex flex-wrap -mx-3">
            <div className="w-full md:w-1/3 px-3 mb-6">
              <h2 className="text-lg font-semibold">Shipping Address</h2>
              <p>{trackingInfo.shipping_address.full_address}</p>
            </div>
            <div className="w-full md:w-1/3 px-3 mb-6">
              <h2 className="text-lg font-semibold">City</h2>
              <p>{trackingInfo.shipping_address.place}</p>
            </div>
            <div className="w-full md:w-1/3 px-3 mb-6">
              <h2 className="text-lg font-semibold">Courier</h2>
              <p>{trackingInfo.carrier}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
