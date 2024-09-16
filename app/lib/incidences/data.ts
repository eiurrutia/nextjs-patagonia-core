import { executeQuery } from '@/app/lib/snowflakeClient';  // Importa la función reutilizable
import { Incidence } from './../definitions';

export async function fetchFilteredIncidences(
  query: string,
  currentPage: number,
  status: string
): Promise<Incidence[]> {
  const uppercaseQuery = `%${query.toUpperCase()}%`;
  const statusFilter = status.toUpperCase();

  let sqlText = `
    SELECT
        OI.ECOMMERCE_NAME_CHILD,
        TO_CHAR(OI.INCIDENCE_CREATE_DATE, 'YYYY-MM-DD HH24:MI') AS INCIDENCE_CREATE_DATE,
        TO_CHAR(OI.LAST_REGISTER_DATE, 'YYYY-MM-DD HH24:MI') AS LAST_REGISTER_DATE,
        OI.DESCRIPTION,
        OI.NAME,
        OI.STATE,
        OI.USER,
        MAX(OS.SUBORDER_ID) AS SUBORDER_ID,
        MAX(OS.WAREHOUSE) AS WAREHOUSE,
        MAX(OS.TRANSFER_WAREHOUSE) AS TRANSFER_WAREHOUSE,
        MAX(OS.DELIVERY_METHOD) AS DELIVERY_METHOD,
        MAX(OS.STATE) AS OMS_STATE
    FROM PATAGONIA.CORE_TEST.OMS_ORDER_INCIDENCE OI
    LEFT JOIN PATAGONIA.CORE_TEST.OMS_SUBORDERS OS ON OI.ECOMMERCE_NAME_CHILD = OS.ECOMMERCE_NAME_CHILD
    WHERE
        (UPPER(OI.ECOMMERCE_NAME_CHILD) LIKE ? OR
        UPPER(OI.INCIDENCE_CREATE_DATE) LIKE ? OR
        UPPER(OI.LAST_REGISTER_DATE) LIKE ? OR
        UPPER(OI.DESCRIPTION) LIKE ? OR
        UPPER(OI.NAME) LIKE ? OR
        UPPER(OI.STATE) LIKE ? OR
        UPPER(OI.USER) LIKE ? OR
        UPPER(OS.WAREHOUSE) LIKE ?)`;

  if (status !== 'all') {
    sqlText += ` AND UPPER(OI.STATE) = ?`;
  }

  sqlText += `
    GROUP BY OI.ECOMMERCE_NAME_CHILD, OI.INCIDENCE_CREATE_DATE, OI.LAST_REGISTER_DATE, OI.DESCRIPTION, OI.NAME, OI.USER, OI.STATE
    ORDER BY OI.LAST_REGISTER_DATE DESC`;

  const binds = [
    uppercaseQuery,
    uppercaseQuery,
    uppercaseQuery,
    uppercaseQuery,
    uppercaseQuery,
    uppercaseQuery,
    uppercaseQuery,
    uppercaseQuery,
  ];

  if (status !== 'all') {
    binds.push(statusFilter);
  }

  return await executeQuery<Incidence>(sqlText, binds);
}

export async function fetchOpenedIncidences(
  startDate: string,
  endDate: string
): Promise<Incidence[]> {
  const sqlText = `
    SELECT
        OI.ECOMMERCE_NAME_CHILD,
        TO_CHAR(OI.INCIDENCE_CREATE_DATE, 'YYYY-MM-DD HH24:MI') AS INCIDENCE_CREATE_DATE,
        TO_CHAR(OI.LAST_REGISTER_DATE, 'YYYY-MM-DD HH24:MI') AS LAST_REGISTER_DATE,
        OI.DESCRIPTION,
        OI.NAME,
        OI.STATE,
        OI.USER,
        MAX(OS.SUBORDER_ID) AS SUBORDER_ID,
        MAX(OS.WAREHOUSE) AS WAREHOUSE,
        MAX(OS.TRANSFER_WAREHOUSE) AS TRANSFER_WAREHOUSE,
        MAX(OS.DELIVERY_METHOD) AS DELIVERY_METHOD,
        MAX(OS.STATE) AS OMS_STATE,
        MAX(OS.PARTNER_NAME) AS PARTNER_NAME,
        MAX(OS.PARTNER_VAT) AS PARTNER_VAT
    FROM PATAGONIA.CORE_TEST.OMS_ORDER_INCIDENCE OI
    LEFT JOIN PATAGONIA.CORE_TEST.OMS_SUBORDERS OS ON OI.ECOMMERCE_NAME_CHILD = OS.ECOMMERCE_NAME_CHILD
    WHERE
        UPPER(OI.INCIDENCE_CREATE_DATE) BETWEEN ? AND ?
        AND UPPER(OI.STATE) = 'ABIERTA'
    GROUP BY OI.ECOMMERCE_NAME_CHILD, OI.INCIDENCE_CREATE_DATE, OI.LAST_REGISTER_DATE, OI.DESCRIPTION, OI.NAME, OI.USER, OI.STATE
    ORDER BY OI.LAST_REGISTER_DATE DESC`;

  const binds = [startDate, endDate];

  return await executeQuery<Incidence>(sqlText, binds);
}
