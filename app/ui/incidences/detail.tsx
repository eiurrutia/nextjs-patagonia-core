import { 
    fetchIncidenceById, 
    fetchIncidenceHistoryById, 
    fetchOrderLinesByIncidence 
  } from '@/app/lib/incidences/data';
  import { 
    CalendarIcon, 
    HomeIcon, 
    UserIcon, 
    ChatBubbleOvalLeftEllipsisIcon, 
    ArrowsRightLeftIcon, 
    TruckIcon, 
    IdentificationIcon, 
    ArrowTopRightOnSquareIcon 
  } from '@heroicons/react/24/outline';
  import { format, toZonedTime } from 'date-fns-tz';
  import { OMSOrderLine } from '@/app/lib/definitions';
  
  const TIME_ZONE = 'America/Santiago';
  
  const fieldIcons = {
    warehouse: <HomeIcon className="h-6 w-6 text-gray-500" />,
    transferWarehouse: <ArrowsRightLeftIcon className="h-6 w-6 text-gray-500" />,
    state: <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6 text-gray-500" />,
    lastUpdated: <CalendarIcon className="h-6 w-6 text-gray-500" />,
    user: <UserIcon className="h-6 w-6 text-gray-500" />,
    ecommerceName: <IdentificationIcon className="h-6 w-6 text-gray-500" />,
    deliveryMethod: <TruckIcon className="h-6 w-6 text-gray-500" />,
    orderDate: <CalendarIcon className="h-6 w-6 text-gray-500" />,
  };
  
  const formatDate = (dateString: string, withTime = false, applyTimeZone = true) => {
    let date = new Date(dateString);
    if (applyTimeZone) {
      date = toZonedTime(date, TIME_ZONE);
    }
    return format(date, withTime ? 'dd-MM-yyyy HH:mm' : 'dd-MM-yyyy');
  };
  
  export default async function IncidenceDetail({ id }: { id: string }) {
    const incidence = await fetchIncidenceById(id);
    const history = await fetchIncidenceHistoryById(id);
    const orderLines = await fetchOrderLinesByIncidence(id);
  
    const firstOrderLine: OMSOrderLine | null = orderLines.find(
      (line): line is OMSOrderLine => !!line?.ECOMMERCE_NAME
    ) || null;

    const matchingOrderLine = orderLines.find(
        (line: OMSOrderLine) => line.ECOMMERCE_NAME_CHILD === id
      );
  
    if (!incidence) return <div>No se encontró la incidencia.</div>;
  
    return (
      <div className="p-4 bg-gray-50 rounded-lg space-y-8">
        <div className="space-y-4 bg-white p-4 rounded-lg relative">
          <h1 className="text-xl font-bold mb-4">Incidencia {incidence.ECOMMERCE_NAME_CHILD}</h1>
          <a
            href={`https://patagonia.omni.pro/orders/${matchingOrderLine?.SUBORDER_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-4 right-4 text-blue-600 flex items-center space-x-1"
          >
            <span>Ver en OMS</span>
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </a>
          <div className="flex items-center space-x-4">
            {fieldIcons.warehouse}
            <p><strong>Tienda Entrega:</strong> {incidence.WAREHOUSE}</p>
          </div>
          {incidence.TRANSFER_WAREHOUSE && (
            <div className="flex items-center space-x-4">
              {fieldIcons.transferWarehouse}
              <p><strong>Transferencias:</strong> {incidence.TRANSFER_WAREHOUSE}</p>
            </div>
          )}
          <div className="flex items-center space-x-4">
            {fieldIcons.state}
            <p><strong>Estado:</strong> {incidence.STATE}</p>
          </div>
          <div className="flex items-center space-x-4">
            {fieldIcons.lastUpdated}
            <p><strong>Última Modificación:</strong> {formatDate(incidence.LAST_REGISTER_DATE, true)}</p>
          </div>
        </div>
  
        <h2 className="text-lg font-semibold mt-6 mb-6">Historial de Incidencia</h2>
        <div className="rounded-lg bg-white p-4">
          <table className="min-w-full text-gray-900">
            <thead className="text-left text-sm font-medium">
              <tr>
                <th className="px-2 py-5">Fecha</th>
                <th className="px-2 py-5">Hora</th>
                <th className="px-2 py-5">Usuario</th>
                <th className="px-2 py-5">Mensaje</th>
                <th className="px-2 py-5">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {history.map((entry) => (
                <tr key={entry.PRIMARY_KEY} className="border-b text-sm">
                  <td className="px-2 py-3">{formatDate(entry.CREATE_DATE)}</td>
                  <td className="px-2 py-3 text-gray-500">{formatDate(entry.CREATE_DATE, true).split(' ')[1]}</td>
                  <td className="px-2 py-3">{entry.USER}</td>
                  <td className="px-2 py-3">{entry.DESCRIPTION}</td>
                  <td className="px-2 py-3">{entry.STATE}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  
        <h2 className="text-lg font-semibold mt-6 mb-6">Líneas de la Orden</h2>
        <div className="rounded-lg bg-white p-4">
          <div className="space-y-4 bg-white p-4 rounded-lg">
            <div className="flex items-center space-x-4">
              {fieldIcons.ecommerceName}
              <p>{firstOrderLine?.ECOMMERCE_NAME}</p>
              <div className="flex space-x-4 ml-4">
                <a
                  href={`https://patagonia.omni.pro/orders/esaleorder/${firstOrderLine?.ORDER_ID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 flex items-center space-x-1"
                >
                  <span>Ver en OMS</span>
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </a>
                <a
                  href={`https://admin.shopify.com/store/patagoniachile/orders/${firstOrderLine?.SHOPIFY_ORDER_ID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 flex items-center space-x-1"
                >
                  <span>Ver en Shopify</span>
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {fieldIcons.deliveryMethod}
              <p>{firstOrderLine?.DELIVERY_METHOD_NAME}</p>
            </div>
            <div className="flex items-center space-x-4">
              {fieldIcons.orderDate}
              <p>{firstOrderLine ? formatDate(firstOrderLine.DATE_ORDER, true, false) : 'No disponible'}</p>
            </div>
          </div>
          <table className="min-w-full text-gray-900">
            <thead className="text-left text-sm font-medium">
              <tr>
                <th className="px-2 py-5">Sub Orden</th>
                <th className="px-2 py-5">Código</th>
                <th className="px-2 py-5">Producto</th>
                <th className="px-2 py-5">Cantidad</th>
                <th className="px-2 py-5">Bodega</th>
                <th className="px-2 py-5">Transferencia</th>
                <th className="px-2 py-5">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {orderLines.map((line) => (
                <tr key={line.ECOMMERCE_NAME_CHILD} className="border-b text-sm">
                  <td className="px-2 py-3">{line.ECOMMERCE_NAME_CHILD}</td>
                  <td className="px-2 py-3">{line.DEFAULT_CODE}</td>
                  <td className="px-2 py-3">{line.PRODUCT_NAME}</td>
                  <td className="px-2 py-3">{line.PRODUCT_UOM_QTY}</td>
                  <td className="px-2 py-3">{line.WAREHOUSE}</td>
                  <td className="px-2 py-3">{line.TRANSFER_WAREHOUSE}</td>
                  <td className="px-2 py-3">{line.STATE_OPTION_NAME}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  