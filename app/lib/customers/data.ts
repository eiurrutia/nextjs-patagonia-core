import { executeQuery } from '@/app/lib/snowflakeClient';
import { CustomerShopify, CustomerERP, Order } from './../definitions';
import { unstable_noStore as noStore } from 'next/cache';

const ITEMS_PER_PAGE = 10;

export async function fetchFilteredCustomers(
  query: string,
  currentPage: number
): Promise<CustomerShopify[]> {
  noStore();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const uppercaseQuery = `%${query.toUpperCase()}%`;

  const sqlText = `
    SELECT
        SHOPIFY_ID,
        FIRST_NAME,
        LAST_NAME,
        EMAIL,
        LAST_ORDER_NAME,
        MOST_REPEATED_PHONE,
        MOST_REPEATED_ADDRESS1,
        MOST_REPEATED_PROVINCE,
        MOST_REPEATED_CITY,
        MOST_REPEATED_RUT
    FROM PATAGONIA.CORE_TEST.SHOPIFY_CUSTOMERS
    WHERE
        UPPER(FIRST_NAME) LIKE ? OR
        UPPER(LAST_NAME) LIKE ? OR
        UPPER(EMAIL) LIKE ?
    LIMIT ? OFFSET ?`;

  const binds = [
    uppercaseQuery, uppercaseQuery, uppercaseQuery,
    ITEMS_PER_PAGE, offset
  ];

  return await executeQuery<CustomerShopify>(sqlText, binds);
}

export async function fetchShopifyCustomersByRut(value: string): Promise<CustomerShopify[]> {
  noStore();
  const uppercaseValue = `${value.toUpperCase()}`;

  const sqlText = `
    SELECT *
    FROM PATAGONIA.CORE_TEST.SHOPIFY_CUSTOMERS
    WHERE UPPER(MOST_REPEATED_RUT) ILIKE ?;`;

  const binds = [uppercaseValue];

  return await executeQuery<CustomerShopify>(sqlText, binds);
}

export async function fetchCustomersPages(query: string): Promise<number> {
  noStore();
  const uppercaseQuery = `%${query.toUpperCase()}%`;

  const sqlText = `
    SELECT COUNT(*)
    FROM PATAGONIA.CORE_TEST.SHOPIFY_CUSTOMERS
    WHERE
      UPPER(FIRST_NAME) LIKE ? OR
      UPPER(LAST_NAME) LIKE ? OR
      UPPER(EMAIL) LIKE ?`;

  const binds = [uppercaseQuery, uppercaseQuery, uppercaseQuery];

  const result = await executeQuery<{ 'COUNT(*)': string }>(sqlText, binds);
  const totalRows = parseInt(result[0]['COUNT(*)'], 10);
  return Math.ceil(totalRows / ITEMS_PER_PAGE);
}

export async function fetchFilteredERPCustomers(
  query: string,
  currentPage: number
): Promise<CustomerERP[]> {
  noStore();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const uppercaseQuery = `%${query.toUpperCase()}%`;

  const sqlText = `
    SELECT
        CUSTOMERACCOUNT,
        NAMEALIAS,
        PRIMARYCONTACTEMAIL
    FROM PATAGONIA.CORE_TEST.ERP_CUSTOMERS
    WHERE
        UPPER(CUSTOMERACCOUNT) LIKE ? OR
        UPPER(NAMEALIAS) LIKE ? OR
        UPPER(PRIMARYCONTACTEMAIL) LIKE ?
    LIMIT ? OFFSET ?`;

  const binds = [
    uppercaseQuery, uppercaseQuery, uppercaseQuery,
    ITEMS_PER_PAGE, offset
  ];

  return await executeQuery<CustomerERP>(sqlText, binds);
}

export async function fetchERPCustomersPages(query: string): Promise<number> {
  noStore();
  const uppercaseQuery = `%${query.toUpperCase()}%`;

  const sqlText = `
    SELECT COUNT(*)
    FROM PATAGONIA.CORE_TEST.ERP_CUSTOMERS
    WHERE
      UPPER(CUSTOMERACCOUNT) LIKE ? OR
      UPPER(NAMEALIAS) LIKE ? OR
      UPPER(PRIMARYCONTACTEMAIL) LIKE ?`;

  const binds = [uppercaseQuery, uppercaseQuery, uppercaseQuery];

  const result = await executeQuery<{ 'COUNT(*)': string }>(sqlText, binds);
  const totalRows = parseInt(result[0]['COUNT(*)'], 10);
  return Math.ceil(totalRows / ITEMS_PER_PAGE);
}

export async function fetchERPCustomerById(id: string): Promise<CustomerERP[]> {
  noStore();
  const uppercaseId = `${id.toUpperCase()}`;

  const sqlText = `
    SELECT *
    FROM PATAGONIA.CORE_TEST.ERP_CUSTOMERS
    WHERE UPPER(CUSTOMERACCOUNT) = ?;`;

  const binds = [uppercaseId];

  return await executeQuery<CustomerERP>(sqlText, binds);
}

export async function fetchSalesByCustomer(customer_id: string): Promise<Order[]> {
  noStore();
  const uppercasecustomerId = `${customer_id.toUpperCase()}`;

  const sqlText = `
    SELECT *
    FROM PATAGONIA.CORE_TEST.ERP_PROCESSED_SALES
    WHERE UPPER(CUSTOMERACCOUNT) ILIKE ?;`;

  const binds = [uppercasecustomerId];

  return await executeQuery<Order>(sqlText, binds);
}

function getBasicAuthHeader(user: string, password: string) {
  const token = Buffer.from(`${user}:${password}`).toString('base64');
  return `Basic ${token}`;
}

export async function fetchZendeskTickets(email: string, startTime?: string, endTime?: string) {
  const baseUrl = 'https://patagoniachile.zendesk.com/api/v2/search.json';
  let query = `type:ticket requester:${email}`;
  if (startTime) {
      query += ` start_time=${startTime}`;
  }
  if (endTime) {
      query += ` end_time=${endTime}`;
  }
  const url = `${baseUrl}?query=${encodeURIComponent(query)}`;

  const user = process.env.ZENDESK_USER || '';
  const password = process.env.ZENDESK_PASSWORD || '';
  const authHeader = getBasicAuthHeader(user, password);

  try {
      const response = await fetch(url, {
          method: 'GET',
          headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json'
          }
      });

      if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      return data;
  } catch (error) {
      console.error('Error fetching Zendesk tickets:', error);
      throw error;
  }
}
