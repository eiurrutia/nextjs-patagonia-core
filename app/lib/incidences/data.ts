import { executeQuery } from '@/app/lib/snowflakeClient';  // Importa la función reutilizable
import { Incidence, IncidenceHistory } from './../definitions';

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

export async function fetchIncidenceById(
  id: string
): Promise<Incidence> {
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
      MAX(OS.STATE) AS OMS_STATE
    FROM PATAGONIA.CORE_TEST.OMS_ORDER_INCIDENCE OI
    LEFT JOIN PATAGONIA.CORE_TEST.OMS_SUBORDERS OS ON OI.ECOMMERCE_NAME_CHILD = OS.ECOMMERCE_NAME_CHILD
    WHERE OI.ECOMMERCE_NAME_CHILD = ?
    GROUP BY OI.ECOMMERCE_NAME_CHILD, OI.INCIDENCE_CREATE_DATE, OI.LAST_REGISTER_DATE, OI.DESCRIPTION, OI.NAME, OI.USER, OI.STATE
    ORDER BY OI.LAST_REGISTER_DATE DESC
  `;

  const binds = [id];

  const result = await executeQuery<Incidence>(sqlText, binds);
  return result[0];
}

export async function fetchIncidenceHistoryById(
  id: string
): Promise<IncidenceHistory[]> {
  const sqlText = `
    SELECT
      PRIMARY_KEY,
      ECOMMERCE_NAME_CHILD,
      TO_CHAR(CREATE_DATE, 'YYYY-MM-DD HH24:MI') AS CREATE_DATE,
      DESCRIPTION,
      NAME,
      STATE,
      USER,
      TO_CHAR(SNOWFLAKE_CREATED_AT, 'YYYY-MM-DD HH24:MI') AS SNOWFLAKE_CREATED_AT,
      TO_CHAR(SNOWFLAKE_UPDATED_AT, 'YYYY-MM-DD HH24:MI') AS SNOWFLAKE_UPDATED_AT
    FROM PATAGONIA.CORE_TEST.OMS_HISTORY_INCIDENCE
    WHERE ECOMMERCE_NAME_CHILD = ?
    ORDER BY CREATE_DATE DESC
  `;

  const binds = [id];
  return await executeQuery<IncidenceHistory>(sqlText, binds);
}

export async function fetchOrderLinesByIncidence(incidenceId: string) {
  const sqlText = `
    SELECT 
      ECOMMERCE_NAME_CHILD,
      ECOMMERCE_NAME,
      DELIVERY_METHOD_NAME,
      DATE_ORDER, 
      DEFAULT_CODE, 
      PRODUCT_NAME, 
      PRODUCT_UOM_QTY, 
      WAREHOUSE, 
      TRANSFER_WAREHOUSE, 
      STATE_OPTION_NAME 
    FROM PATAGONIA.CORE_TEST.OMS_SUBORDERSLINE 
    WHERE ECOMMERCE_NAME = (
      SELECT ECOMMERCE_NAME 
      FROM PATAGONIA.CORE_TEST.OMS_SUBORDERSLINE 
      WHERE ECOMMERCE_NAME_CHILD = ?
      LIMIT 1
    )
  `;

  const result = await executeQuery(sqlText, [incidenceId]);
  return result;
}
