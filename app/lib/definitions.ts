import NextAuth from "next-auth";

// This file contains type definitions for your data.
// It describes the shape of the data, and what data type each property should accept.
// For simplicity of teaching, we're manually defining these types.
// However, these types are generated automatically if you're using an ORM such as Prisma.
declare module "next-auth" {
  interface User {
    role?: string;
  }

  interface Session {
    user?: User;
  }
}


export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  image_url: string;
};

export type CustomerShopify = {
  SHOPIFY_ID: string;
  FIRST_NAME: string;
  LAST_NAME: string;
  EMAIL: string;
  ORDERS_COUNT: number;
  LAST_ORDER_NAME: string;
  MOST_REPEATED_PHONE: string;
  MOST_REPEATED_ADDRESS1: string;
  MOST_REPEATED_PROVINCE: string;
  MOST_REPEATED_RUT: string;
  MOST_REPEATED_CITY: string;
};

export type CustomerERP = {
  CUSTOMERACCOUNT: string;
  NAMEALIAS: string;
  CUSTOMERGROUPID: string;
  PRIMARYCONTACTEMAIL: string;
};

export type Order = {
  CANAL: string;
  CECO: string;
  CREATEDTRANSACTION: string;
  CURRENCYCODE: string;
  CUSTOMERACCOUNT: string;
  INVOICEDATE: string;
  INVOICEID: string;
  ORDERNUMBER: string;
  ECOMMERCE_NAME: string;
  NAME: string;
  ORDER_ID: string;
  ORGANIZATIONNAME: string;
  QTYTOTAL: number;
  SALESID: string;
  SALESPRICETOTAL: number;
  TAXGROUP: string;
  SHOPIFY_ID: string;
  OMS_ID: string;
};

export type OrderLine = {
  LINENUM: number;
  SALESID: string;
  SALESPRICE: string;
  QTY: number;
  ORIGINALPRICE: number;
  SKU: string;
  INVENTLOCATIONID: string;
  LINEDISC: string;
  SUMLINEDISC: number;
  ITEMNAME: string;
  EXTERNALITEMID: string;
  LINEAMOUNTWITHTAXES: number;
  TRACKINGINFO: string;
};

export type OMSOrderLine = {
  SUBORDER_ID: string;
  ORDER_ID: string;
  SHOPIFY_ORDER_ID: string;
  ECOMMERCE_NAME: string;
  DELIVERY_METHOD_NAME: string;
  DATE_ORDER: string;
  ECOMMERCE_NAME_CHILD: string;
  DEFAULT_CODE: string;
  PRODUCT_NAME: string;
  PRODUCT_UOM_QTY: number;
  WAREHOUSE: string;
  TRANSFER_WAREHOUSE: string;
  STATE_OPTION_NAME: string;
}

export type Incidence = {
  ECOMMERCE_NAME_CHILD: string;
  INCIDENCE_CREATE_DATE: string;
  LAST_REGISTER_DATE: string;
  DESCRIPTION: number;
  NAME: number;
  STATE: string;
  USER: string;
  SUBORDER_ID: string;
  WAREHOUSE: string;
  TRANSFER_WAREHOUSE: string;
  DELIVERY_METHOD: string;
  OMS_STATE: string;
  PARTNER_VAT: string;
  PARTNER_NAME: string;
};

export type IncidenceHistory = {
  PRIMARY_KEY: string;
  ECOMMERCE_NAME_CHILD: string;
  CREATE_DATE: string;
  LAST_REGISTER_DATE: string;
  DESCRIPTION: number;
  NAME: number;
  STATE: string;
  USER: string;
  SUBORDER_ID: string;
  WAREHOUSE: string;
  TRANSFER_WAREHOUSE: string;
  DELIVERY_METHOD: string;
  OMS_STATE: string;
  PARTNER_VAT: string;
  PARTNER_NAME: string;
};

export type ZendeskTicket = {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  requester_id: string;
}

export type SimilarImage = {
  item_color: string;
  image_src: string;
  distance: number;
};

export type TrackingStatus = {
  code: string;
};

export type TrackingInfo = {
  data: {
    status: TrackingStatus;
  } | null;
};

export type TradeInRecord = {
  ID: string;
  FIRST_NAME: string;
  LAST_NAME: string;
  RUT: string;
  EMAIL: string;
  PHONE: string;
  SELECTED_ITEM_COLOR: string;
  ADDRESS: string;
  HOUSE_DETAILS?: string;
  CLIENT_COMMENT?: string;
  ADMIN_COMMENT?: string;
  STATUS: string;
  SNOWFLAKE_CREATED_AT: string;
  SNOWFLAKE_UPDATED_AT: string;
}

export type Invoice = {
  id: string;
  customer_id: string;
  amount: number;
  date: string;
  // In TypeScript, this is called a string union type.
  // It means that the "status" property can only be one of the two strings: 'pending' or 'paid'.
  status: 'pending' | 'paid';
};

export type Revenue = {
  month: string;
  revenue: number;
};

export type LatestInvoice = {
  id: string;
  name: string;
  image_url: string;
  email: string;
  amount: string;
};

// The database returns a number for amount, but we later format it to a string with the formatCurrency function
export type LatestInvoiceRaw = Omit<LatestInvoice, 'amount'> & {
  amount: number;
};

export type InvoicesTable = {
  id: string;
  customer_id: string;
  name: string;
  email: string;
  image_url: string;
  date: string;
  amount: number;
  status: 'pending' | 'paid';
};

export type CustomersTableType = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  total_invoices: number;
  total_pending: number;
  total_paid: number;
};

export type FormattedCustomersTable = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  total_invoices: number;
  total_pending: string;
  total_paid: string;
};

export type CustomerField = {
  id: string;
  name: string;
};

export type InvoiceForm = {
  id: string;
  customer_id: string;
  amount: number;
  status: 'pending' | 'paid';
};

export type StockSegment = {
  SKU: string;
  COYHAIQUE: number;
  LASCONDES: number;
  MALLSPORT: number;
  COSTANERA: number;
  CONCEPCION: number;
  PTOVARAS: number;
  LADEHESA: number;
  PUCON: number;
  TEMUCO: number;
  OSORNO: number;
  ALERCE: number;
  BNAVENTURA: number;
}