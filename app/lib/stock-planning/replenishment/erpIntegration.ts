const ERP_TOKEN_URL = process.env.ERP_TOKEN_URL || '';
const ERP_URL = process.env.ERP_URL || '';
const ERP_CLIENT_ID = process.env.ERP_CLIENT_ID || '';
const ERP_CLIENT_SECRET = process.env.ERP_CLIENT_SECRET || '';

/**
 * Gets an ERP token.
 * @returns The ERP token.
 * @throws If an error occurs.
 */
export async function getERPToken(): Promise<string> {
    const formData = new FormData();
    formData.append('grant_type', 'client_credentials');
    formData.append('client_id', ERP_CLIENT_ID);
    formData.append('client_secret', ERP_CLIENT_SECRET);
    formData.append('scope', `${ERP_URL}/.default`);
  
    const response = await fetch(`${ERP_TOKEN_URL}/oauth2/v2.0/token`, {
      method: 'POST',
      body: formData
    });
  
    const data = await response.json();
    if (!data.access_token) {
      throw new Error('Error al obtener token ERP');
    }
    return data.access_token;
  }
  
    /**
     * Creates a header in the ERP for a given transfer order.
     * @param token - The ERP token.
     * @param receivingWarehouseId - The receiving warehouse ID.
     * @returns The ERP transfer order number.
     * @throws If an error occurs.
     */
  export async function createERPHeader(token: string, receivingWarehouseId: string): Promise<string> {
    const body = {
      "dataAreaId": "pat",
      "RequestedReceiptDate": new Date().toISOString(),
      "ShippingWarehouseId": "CD",
      "ReceivingWarehouseId": receivingWarehouseId,
      "TransferOrderPromisingMethod": "None",
      "AreLinesAutomaticallyReservedByDefault": "Yes",
      "RequestedShippingDate": new Date().toISOString(),
      "TransferOrderStockTransferPriceType": "CostPrice"
    };
  
    const response = await fetch(`${ERP_URL}/data/TransferOrderHeaders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
  
    if (!response.ok) {
      throw new Error(`Error al crear cabecera para ${receivingWarehouseId}`);
    }
  
    const data = await response.json();
    return data.TransferOrderNumber;
  }
  
  /**
   * Creates a line in the ERP for a given transfer order.
   * @param token - The ERP token.
   * @param transferOrderNumber - The transfer order number.
   * @param lineData - The line data.
   * @returns The ERP line ID.
   * @throws If an error occurs.
  */
  export async function createERPLine(
    token: string, 
    transferOrderNumber: string, 
    lineData: {
      ItemNumber: string;
      ProductColorId: string;
      ProductConfigurationId: string;
      ProductSizeId: string;
      ProductStyleId: string;
      OrderedInventoryStatusId: string;
      ShippingWarehouseLocationId: string;
      TransferQuantity: number;
      RequestedReceiptDate: string;
      RequestedShippingDate: string;
      SalesTaxItemGroupCodeShipment: string;
      SalesTaxItemGroupCodeReceipt: string;
      PriceType: string;
      LineNumber: number;
    }
  ): Promise<{ ERP_LINE_ID: string }> {
    const body = {
      "dataAreaId": "pat",
      "TransferOrderNumber": transferOrderNumber,
      "LineNumber": lineData.LineNumber,
      "OrderedInventoryStatusId": lineData.OrderedInventoryStatusId,
      "ProductStyleId": lineData.ProductStyleId,
      "TransferQuantity": lineData.TransferQuantity,
      "RequestedReceiptDate": lineData.RequestedReceiptDate,
      "RequestedShippingDate": lineData.RequestedShippingDate,
      "ProductConfigurationId": lineData.ProductConfigurationId,
      "ProductSizeId": lineData.ProductSizeId,
      "ProductColorId": lineData.ProductColorId,
      "ItemNumber": lineData.ItemNumber,
      "ShippingWarehouseLocationId": lineData.ShippingWarehouseLocationId,
      "SalesTaxItemGroupCodeShipment": lineData.SalesTaxItemGroupCodeShipment,
      "SalesTaxItemGroupCodeReceipt": lineData.SalesTaxItemGroupCodeReceipt,
      "PriceType": lineData.PriceType,
      // Fixed fields
      "ATPTimeFenceDays": 0,
      "AllowedUnderdeliveryPercentage": 0,
      "WillProductReceivingCrossDockProducts": "No",
      "OverrideFEFODateControl": "No",
      "IntrastatCostAmount": 0,
      "ATPDelayedSupplyOffsetDays": 0,
      "IntrastatStatisticalValue": 0,
      "OverrideSalesTaxShipment": "No",
      "TransferCatchWeightQuantity": 0,
      "PlanningPriority": 0,
      "OverrideSalesTaxReceipt": "No",
      "TransferOrderPromisingMethod": "None",
      "AllowedOverdeliveryPercentage": 0,
      "ATPBackwardSupplyTimeFenceDays": 0,
      "IsAutomaticallyReserved": "Yes",
      "IsATPIncludingPlannedOrders": false,
      "ATPDelayedDemandOffsetDays": 0,
      "InventCostPriceCalculated": 0,
      "MaximumRetailPrice": 0,
      "NetAmount": 0,
      "DefaultDimension": 0,
      "UnitPrice": 0,
      "CurrencyCode": "",
      "AssessableValueTransactionCurrency": 0,
      "InvntCostPrice": 0,
      "Retention": 0,
      "VATPriceType": "CostPrice"
    };
  
    const response = await fetch(`${ERP_URL}/data/TransferOrderLines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al crear línea para TR ${transferOrderNumber}: ${response.status} ${response.statusText} - ${errorText}`);
    }
  
    const data = await response.json();
    return { ERP_LINE_ID: data.ShippingInventoryLotId };
  }
  