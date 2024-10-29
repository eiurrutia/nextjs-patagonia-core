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
  import { OMSOrderLine } from '@/app/lib/definitions';
  import { formatDate } from '@/app/utils/dateUtils';
  
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
        {/* Main Card */}
        <div className="bg-white p-6 rounded-lg relative">
          <h1 className="text-xl font-bold mb-2">Incidencia {incidence.ECOMMERCE_NAME_CHILD}</h1>
      
          {/* Ver en OMS button (Desktop) */}
          <a
            href={`https://patagonia.omni.pro/orders/${matchingOrderLine?.SUBORDER_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-6 right-6 hidden md:flex items-center space-x-1 text-blue-600"
          >
            <span>Ver en OMS</span>
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </a>

          {/* Ver en OMS button (Mobile) */}
          <div className="mt-2 md:hidden">
            <a
                href={`https://patagonia.omni.pro/orders/${matchingOrderLine?.SUBORDER_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 flex items-center space-x-1"
            >
                <span>Ver en OMS</span>
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </a>
          </div>
      
          <div className="mt-4 flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              {fieldIcons.warehouse}
              <p><strong>Tienda Entrega:</strong> {incidence.WAREHOUSE}</p>
            </div>
            {incidence.TRANSFER_WAREHOUSE && (
              <div className="flex items-center space-x-2">
                {fieldIcons.transferWarehouse}
                <p><strong>Transferencias:</strong> {incidence.TRANSFER_WAREHOUSE}</p>
              </div>
            )}
            <div className="flex items-center space-x-2">
              {fieldIcons.state}
              <p><strong>Estado:</strong> {incidence.STATE}</p>
            </div>
            <div className="flex items-center space-x-2">
              {fieldIcons.lastUpdated}
              <p><strong>Última Modificación:</strong> {formatDate(incidence.LAST_REGISTER_DATE, true)}</p>
            </div>
          </div>
        </div>
      
        {/* Incidence history */}
        <h2 className="text-lg font-semibold mt-6 mb-6">Historial de Incidencia</h2>
        <div className="rounded-lg bg-white p-4 overflow-x-auto">
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
            <tbody>
              {history.map((entry) => (
                <tr key={entry.PRIMARY_KEY} className="border-b text-sm">
                  <td className="px-2 py-3">{formatDate(entry.CREATE_DATE)}</td>
                  <td className="px-2 py-3 text-gray-500">
                    {formatDate(entry.CREATE_DATE, true).split(' ')[1]}
                  </td>
                  <td className="px-2 py-3">{entry.USER}</td>
                  <td className="px-2 py-3">{entry.DESCRIPTION}</td>
                  <td className="px-2 py-3">{entry.STATE}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      
        {/* Order lines */}
        <h2 className="text-lg font-semibold mt-6 mb-6">Líneas de la Orden</h2>
        <div className="bg-white rounded-lg p-4 overflow-x-auto">
          <div className="space-y-4">
            <div className="relative">
              <div className="flex items-center space-x-4">
                {fieldIcons.ecommerceName}
                <p>{firstOrderLine?.ECOMMERCE_NAME}</p>
              </div>
      
              <div className="flex items-center space-x-4">
                {fieldIcons.deliveryMethod}
                <p>{firstOrderLine?.DELIVERY_METHOD_NAME}</p>
              </div>
              <div className="flex items-center space-x-4">
                {fieldIcons.orderDate}
                <p>{firstOrderLine ? formatDate(firstOrderLine.DATE_ORDER, true, false) : 'No disponible'}</p>
              </div>
      
              {/* Buttons (Desktop) */}
              <div className="absolute right-6 top-0 hidden md:flex space-x-4">
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
      
              {/* Buttons (Mobile) */}
              <div className="flex flex-col space-y-2 mt-2 md:hidden">
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
            <tbody>
              {orderLines.map((line) => (
                <tr
                  key={`${line.ECOMMERCE_NAME_CHILD}-${line.DEFAULT_CODE}`}
                  className="border-b text-sm"
                >
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
  