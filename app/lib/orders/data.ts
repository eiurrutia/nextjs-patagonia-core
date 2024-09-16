import { executeQuery } from '@/app/lib/snowflakeClient';
import fetch from 'node-fetch';
import { Order, OrderLine } from './../definitions';
import { unstable_noStore as noStore } from 'next/cache';

export async function fetchFilteredOrders(query: string, currentPage: number): Promise<Order[]> {
  const uppercaseQuery = `%${query.toUpperCase()}%`;
  
  const sqlText = `
    SELECT
        EPS.CANAL,
        EPS.CECO,
        EPS.CREATEDTRANSACTION,
        EPS.CURRENCYCODE,
        EPS.CUSTOMERACCOUNT,
        EPS.INVOICEDATE,
        EPS.INVOICEID,
        EPS.ORDERNUMBER,
        EPS.ORGANIZATIONNAME,
        EPS.QTYTOTAL,
        EPS.SALESID,
        EPS.SALESPRICETOTAL,
        EPS.TAXGROUP,
        SO.ORDER_ID AS SHOPIFY_ID,
        OMS.ORDER_ID AS OMS_ID
    FROM PATAGONIA.CORE_TEST.ERP_PROCESSED_SALES EPS
    LEFT JOIN PATAGONIA.CORE_TEST.SHOPIFY_ORDERS SO ON EPS.ORDERNUMBER = SO.NAME
    LEFT JOIN (
        SELECT
            ORDER_ID,
            MAX(ECOMMERCE_NAME) AS AGG_ECOMMERCE_NAME
        FROM PATAGONIA.CORE_TEST.OMS_SUBORDERS
        GROUP BY ORDER_ID
    ) OMS ON EPS.ORDERNUMBER = OMS.AGG_ECOMMERCE_NAME
    WHERE
        UPPER(EPS.CANAL) LIKE ? OR
        UPPER(EPS.CECO) LIKE ? OR
        UPPER(EPS.CREATEDTRANSACTION) LIKE ? OR
        UPPER(EPS.CURRENCYCODE) LIKE ? OR
        UPPER(EPS.CUSTOMERACCOUNT) LIKE ? OR
        UPPER(EPS.INVOICEDATE) LIKE ? OR
        UPPER(EPS.INVOICEID) LIKE ? OR
        UPPER(EPS.ORDERNUMBER) LIKE ? OR
        UPPER(EPS.ORGANIZATIONNAME) LIKE ? OR
        UPPER(EPS.QTYTOTAL) LIKE ? OR
        UPPER(EPS.SALESID) LIKE ? OR
        UPPER(EPS.SALESPRICETOTAL) LIKE ? OR
        UPPER(EPS.TAXGROUP) LIKE ?
    ORDER BY EPS.INVOICEDATE DESC
    LIMIT 20`;

  const binds = [
    uppercaseQuery, uppercaseQuery, uppercaseQuery,
    uppercaseQuery, uppercaseQuery, uppercaseQuery,
    uppercaseQuery, uppercaseQuery, uppercaseQuery,
    uppercaseQuery, uppercaseQuery, uppercaseQuery,
    uppercaseQuery
  ];

  return await executeQuery<Order>(sqlText, binds);
}

export async function fetchOrderById(id: string): Promise<Order[]> {
  noStore();
  const uppercaseId = `${id.toUpperCase()}`;
  
  const sqlText = `
    SELECT
        CANAL,
        CECO,
        CREATEDTRANSACTION,
        CURRENCYCODE,
        CUSTOMERACCOUNT,
        INVOICEDATE,
        INVOICEID,
        ORDERNUMBER,
        ORGANIZATIONNAME,
        QTYTOTAL,
        SALESID,
        SALESPRICETOTAL,
        TAXGROUP
    FROM PATAGONIA.CORE_TEST.ERP_PROCESSED_SALES
    WHERE UPPER(SALESID) = ?;`;

  const binds = [uppercaseId];

  return await executeQuery<Order>(sqlText, binds);
}

export async function fetchOrderLinesById(id: string): Promise<OrderLine[]> {
  const uppercaseId = `${id.toUpperCase()}`;

  const sqlText = `
    SELECT
        LINENUM,
        SALESID,
        SALESPRICE,
        QTY,
        ORIGINALPRICE,
        SKU,
        INVENTLOCATIONID,
        LINEDISC,
        SUMLINEDISC,
        ITEMNAME,
        EXTERNALITEMID,
        LINEAMOUNTWITHTAXES
    FROM PATAGONIA.CORE_TEST.ERP_PROCESSED_SALESLINE
    WHERE
        UPPER(SALESID) = ?;`;

  const binds = [uppercaseId];

  return await executeQuery<OrderLine>(sqlText, binds);
}

export async function fetchOrderByCustomerIdandDate(
  customer_id: string,
  period: string
): Promise<Order[]> {
  noStore();
  const uppercaseCustomerId = `${customer_id.toUpperCase()}`;
  
  const today = new Date();
  let startDate = new Date();
  
  switch (period) {
    case '1m':
      startDate.setMonth(today.getMonth() - 1);
      break;
    case '3m':
      startDate.setMonth(today.getMonth() - 3);
      break;
    case '6m':
      startDate.setMonth(today.getMonth() - 6);
      break;
    case '12m':
      startDate.setFullYear(today.getFullYear() - 1);
      break;
    case 'all':
      startDate = new Date(0);
      break;
    default:
      startDate = new Date(0);
  }

  const startDateString = startDate.toISOString();

  const sqlText = `
    SELECT
        CANAL,
        CECO,
        CREATEDTRANSACTION,
        CURRENCYCODE,
        CUSTOMERACCOUNT,
        INVOICEDATE,
        INVOICEID,
        ORDERNUMBER,
        ORGANIZATIONNAME,
        QTYTOTAL,
        SALESID,
        SALESPRICETOTAL,
        TAXGROUP
    FROM PATAGONIA.CORE_TEST.ERP_PROCESSED_SALES
    WHERE UPPER(CUSTOMERACCOUNT) = ?
      AND INVOICEDATE >= ?
    ORDER BY INVOICEDATE DESC;`;

  const binds = [uppercaseCustomerId, startDateString];

  return await executeQuery<Order>(sqlText, binds);
}

export async function fetchInErpNoOmsDifference(startDate: string, endDate: string): Promise<Order[]> {
  noStore();
  
  const sqlText = `
    SELECT
        EPS.*
    FROM PATAGONIA.CORE_TEST.ERP_PROCESSED_SALES EPS
    LEFT JOIN PATAGONIA.CORE_TEST.OMS_SUBORDERS OMS ON EPS.ORDERNUMBER = OMS.ECOMMERCE_NAME
    WHERE EPS.ORDERNUMBER <> ''
      AND UPPER(EPS.INVOICEID) NOT LIKE '61-%'
      AND UPPER(EPS.CECO) <> 'RETAIL'
      AND UPPER(EPS.CECO) <> 'ADMINISTRACION'
      AND UPPER(EPS.CECO) <> 'MARKETING'
      AND UPPER(EPS.CANAL) <> 'WHOLESALE'
      AND UPPER(EPS.ORDERNUMBER) NOT LIKE '%NC%'
      AND UPPER(EPS.ORDERNUMBER) NOT LIKE '%_%'
      AND EPS.INVOICEDATE BETWEEN ? AND ?
      AND OMS.ORDER_ID IS NULL
    ORDER BY EPS.INVOICEDATE DESC`;

  const binds = [startDate, endDate];

  return await executeQuery<Order>(sqlText, binds);
}

export async function fetchInOmsNoErpDifference(startDate: string, endDate: string): Promise<Order[]> {
  noStore();
  
  const sqlText = `
    SELECT
        OMS.*
    FROM PATAGONIA.CORE_TEST.OMS_SUBORDERS OMS
    LEFT JOIN PATAGONIA.CORE_TEST.ERP_PROCESSED_SALES EPS
      ON EPS.ORDERNUMBER = OMS.ECOMMERCE_NAME
    WHERE OMS.ECOMMERCE_NAME <> ''
      AND EPS.SALESID IS NULL
      AND OMS.ORDER_DATE BETWEEN ? AND ?
    ORDER BY OMS.ECOMMERCE_NAME DESC`;

  const binds = [startDate, endDate];

  return await executeQuery<Order>(sqlText, binds);
}

export async function fetchInShopifyNoOmsDifference(startDate: string, endDate: string): Promise<Order[]> {
  noStore();
  
  const sqlText = `
    SELECT
        SH.*
    FROM PATAGONIA.CORE_TEST.SHOPIFY_ORDERS SH
    LEFT JOIN PATAGONIA.CORE_TEST.OMS_SUBORDERS OMS
      ON SH.NAME = OMS.ECOMMERCE_NAME
    WHERE OMS.ORDER_ID IS NULL
      AND SH.FINANCIAL_STATUS = 'paid'
      AND SH.CREATED_AT BETWEEN ? AND ?
    ORDER BY SH.ORDER_ID DESC`;

  const binds = [startDate, endDate];

  return await executeQuery<Order>(sqlText, binds);
}

export async function fetchOrderTrackingInfo(trackingNumber: string) {
  const apiKey = process.env.ENVIAME_TOKEN || '';
  const url = `https://api.enviame.io/api/s2/v2/deliveries/${trackingNumber}/tracking`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api-key': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching order tracking info:', error);
    throw error;
  }
}
