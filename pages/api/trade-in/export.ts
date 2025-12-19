import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';
import ExcelJS from 'exceljs';

// Helper to build WHERE clause from filters
function buildWhereClause(filters: any, type: 'requests' | 'products') {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (type === 'requests') {
    // Request number filter
    if (filters.requestNumber) {
      conditions.push(`LOWER(tr.request_number) LIKE $${paramIndex}`);
      values.push(`%${filters.requestNumber.toLowerCase()}%`);
      paramIndex++;
    }

    // Customer filter (name, email, or RUT)
    if (filters.customer) {
      const customerSearch = `%${filters.customer.toLowerCase()}%`;
      conditions.push(`(
        LOWER(tr.first_name) LIKE $${paramIndex} OR 
        LOWER(tr.last_name) LIKE $${paramIndex} OR 
        LOWER(tr.email) LIKE $${paramIndex} OR 
        LOWER(tr.rut) LIKE $${paramIndex}
      )`);
      values.push(customerSearch);
      paramIndex++;
    }

    // Status filter (multiple)
    if (filters.status && filters.status.length > 0) {
      const statusPlaceholders = filters.status.map((_: string, i: number) => `$${paramIndex + i}`).join(', ');
      conditions.push(`tr.status IN (${statusPlaceholders})`);
      values.push(...filters.status);
      paramIndex += filters.status.length;
    }

    // Delivery method filter (multiple)
    if (filters.deliveryMethod && filters.deliveryMethod.length > 0) {
      const methodPlaceholders = filters.deliveryMethod.map((_: string, i: number) => `$${paramIndex + i}`).join(', ');
      conditions.push(`tr.delivery_method IN (${methodPlaceholders})`);
      values.push(...filters.deliveryMethod);
      paramIndex += filters.deliveryMethod.length;
    }

    // Store filter
    if (filters.store) {
      conditions.push(`tr.received_store_code = $${paramIndex}`);
      values.push(filters.store);
      paramIndex++;
    }

    // Date range filters
    if (filters.dateFrom) {
      conditions.push(`tr.created_at >= $${paramIndex}::timestamp`);
      values.push(filters.dateFrom);
      paramIndex++;
    }

    if (filters.dateTo) {
      conditions.push(`tr.created_at < ($${paramIndex}::timestamp + interval '1 day')`);
      values.push(filters.dateTo);
      paramIndex++;
    }
  } else {
    // Products filters - base condition to exclude pending
    conditions.push(`tp.product_status != 'Pendiente'`);
    
    if (filters.requestNumber) {
      conditions.push(`LOWER(tr.request_number) LIKE $${paramIndex}`);
      values.push(`%${filters.requestNumber.toLowerCase()}%`);
      paramIndex++;
    }

    if (filters.customer) {
      const customerSearch = `%${filters.customer.toLowerCase()}%`;
      conditions.push(`(
        LOWER(tr.first_name) LIKE $${paramIndex} OR 
        LOWER(tr.last_name) LIKE $${paramIndex} OR 
        LOWER(tr.email) LIKE $${paramIndex} OR 
        LOWER(tr.rut) LIKE $${paramIndex}
      )`);
      values.push(customerSearch);
      paramIndex++;
    }

    if (filters.status && filters.status.length > 0) {
      const statusPlaceholders = filters.status.map((_: string, i: number) => `$${paramIndex + i}`).join(', ');
      conditions.push(`tp.product_status IN (${statusPlaceholders})`);
      values.push(...filters.status);
      paramIndex += filters.status.length;
    }

    if (filters.store) {
      conditions.push(`tp.received_store_code = $${paramIndex}`);
      values.push(filters.store);
      paramIndex++;
    }

    if (filters.dateFrom) {
      conditions.push(`tp.created_at >= $${paramIndex}::timestamp`);
      values.push(filters.dateFrom);
      paramIndex++;
    }

    if (filters.dateTo) {
      conditions.push(`tp.created_at < ($${paramIndex}::timestamp + interval '1 day')`);
      values.push(filters.dateTo);
      paramIndex++;
    }

    if (filters.productStyle) {
      conditions.push(`LOWER(tp.product_style) LIKE $${paramIndex}`);
      values.push(`%${filters.productStyle.toLowerCase()}%`);
      paramIndex++;
    }

    if (filters.productState) {
      conditions.push(`(tp.confirmed_calculated_state = $${paramIndex} OR tp.calculated_state = $${paramIndex})`);
      values.push(filters.productState);
      paramIndex++;
    }
  }

  return { 
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '', 
    values 
  };
}

// Fetch all requests with filters (no pagination)
async function fetchAllRequests(filters: any) {
  const { whereClause, values } = buildWhereClause(filters, 'requests');
  
  const query = `
    SELECT 
      tr.request_number,
      tr.first_name,
      tr.last_name,
      tr.email,
      tr.phone,
      tr.rut,
      tr.delivery_method,
      tr.received_store_code,
      tr.address,
      tr.comuna,
      tr.region,
      tr.status,
      tr.client_comment,
      tr.created_at AT TIME ZONE 'UTC' as created_at,
      tr.updated_at AT TIME ZONE 'UTC' as updated_at,
      COUNT(tp.id) as product_count
    FROM trade_in_requests tr
    LEFT JOIN trade_in_products tp ON tr.id = tp.request_id
    ${whereClause}
    GROUP BY tr.id, tr.request_number, tr.first_name, tr.last_name, tr.email, tr.phone, 
             tr.rut, tr.delivery_method, tr.received_store_code, tr.address, tr.comuna, 
             tr.region, tr.status, tr.client_comment, tr.created_at, tr.updated_at
    ORDER BY tr.created_at DESC
  `;

  const result = await sql.query(query, values);
  return result.rows;
}

// Fetch all products with filters (no pagination)
async function fetchAllProducts(filters: any) {
  const { whereClause, values } = buildWhereClause(filters, 'products');
  
  const query = `
    SELECT 
      tp.id,
      tp.product_style,
      tp.product_size,
      tp.credit_estimated,
      tp.calculated_state,
      tp.confirmed_calculated_state,
      tp.confirmed_sku,
      tp.process,
      tp.product_status,
      tp.received_store_code as product_received_store_code,
      tp.created_at AT TIME ZONE 'UTC' as created_at,
      tr.request_number,
      tr.first_name,
      tr.last_name,
      tr.email
    FROM trade_in_products tp
    INNER JOIN trade_in_requests tr ON tp.request_id = tr.id
    ${whereClause}
    ORDER BY tp.created_at DESC
  `;

  const result = await sql.query(query, values);
  return result.rows;
}

// Format date for export
function formatDate(dateInput: string | Date | null): string {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

// Convert delivery method to readable text
function getDeliveryMethodText(method: string | null): string {
  switch (method) {
    case 'shipping': return 'Envío courier';
    case 'pickup': return 'Retiro domicilio';
    case 'store': return 'Entrega en tienda';
    default: return method || '';
  }
}

// Convert status to readable text
function getStatusText(status: string | null): string {
  const statusMap: Record<string, string> = {
    'solicitud_recibida': 'Solicitud recibida',
    'entregado_cliente': 'Entregado por cliente',
    'recepcionado_tienda': 'Recepcionado en tienda',
    'factura_enviada': 'Factura enviada',
    'credito_entregado': 'Crédito entregado',
    'en_tienda': 'En Tienda',
    'etiqueta_generada': 'Etiqueta Generada',
    'empacado': 'Empacado',
    'enviado': 'Enviado',
  };
  return statusMap[status || ''] || status || '';
}

// Convert process to readable text
function getProcessText(process: string | null): string {
  const processMap: Record<string, string> = {
    'IN': 'Invendible',
    'LAV-REP': 'Lavado + Reparación',
    'REP': 'Reparación',
    'LAV': 'Lavado',
    'ETI': 'Etiquetado',
  };
  return processMap[process || ''] || process || '';
}

// Generate CSV content
function generateCSV(data: any[], type: 'requests' | 'products'): string {
  if (type === 'requests') {
    const headers = [
      'N° Solicitud',
      'Nombre',
      'Apellido',
      'Email',
      'Teléfono',
      'RUT',
      'Método Entrega',
      'Tienda Recepción',
      'Dirección',
      'Comuna',
      'Región',
      'Estado',
      'N° Productos',
      'Comentario Cliente',
      'Fecha Creación',
      'Última Actualización'
    ];

    const rows = data.map(row => [
      row.request_number || '',
      row.first_name || '',
      row.last_name || '',
      row.email || '',
      row.phone || '',
      row.rut || '',
      getDeliveryMethodText(row.delivery_method),
      row.received_store_code || '',
      row.address || '',
      row.comuna || '',
      row.region || '',
      getStatusText(row.status),
      row.product_count || 0,
      row.client_comment || '',
      formatDate(row.created_at),
      formatDate(row.updated_at)
    ]);

    return [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
  } else {
    const headers = [
      'ID',
      'Estilo',
      'Talla',
      'SKU Confirmado',
      'Bodega Recepción',
      'N° Solicitud',
      'Cliente',
      'Email',
      'Estado Producto',
      'Proceso',
      'Estado Operativo',
      'Crédito Estimado',
      'Fecha Ingreso'
    ];

    const rows = data.map(row => [
      row.id || '',
      row.product_style || '',
      row.product_size || '',
      row.confirmed_sku || '',
      row.product_received_store_code || '',
      row.request_number || '',
      `${row.first_name || ''} ${row.last_name || ''}`.trim(),
      row.email || '',
      row.confirmed_calculated_state || row.calculated_state || '',
      getProcessText(row.process),
      getStatusText(row.product_status),
      row.credit_estimated || '',
      formatDate(row.created_at)
    ]);

    return [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
  }
}

// Generate Excel file using exceljs library
async function generateExcel(data: any[], type: 'requests' | 'products'): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Patagonia Trade-In';
  workbook.created = new Date();
  
  const worksheet = workbook.addWorksheet(type === 'requests' ? 'Solicitudes' : 'Productos');

  if (type === 'requests') {
    // Define columns with headers and widths
    worksheet.columns = [
      { header: 'N° Solicitud', key: 'request_number', width: 15 },
      { header: 'Nombre', key: 'first_name', width: 15 },
      { header: 'Apellido', key: 'last_name', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Teléfono', key: 'phone', width: 15 },
      { header: 'RUT', key: 'rut', width: 12 },
      { header: 'Método Entrega', key: 'delivery_method', width: 18 },
      { header: 'Tienda Recepción', key: 'received_store_code', width: 18 },
      { header: 'Dirección', key: 'address', width: 30 },
      { header: 'Comuna', key: 'comuna', width: 15 },
      { header: 'Región', key: 'region', width: 20 },
      { header: 'Estado', key: 'status', width: 20 },
      { header: 'N° Productos', key: 'product_count', width: 12 },
      { header: 'Comentario Cliente', key: 'client_comment', width: 30 },
      { header: 'Fecha Creación', key: 'created_at', width: 18 },
      { header: 'Última Actualización', key: 'updated_at', width: 18 },
    ];

    // Add rows
    data.forEach(row => {
      worksheet.addRow({
        request_number: row.request_number || '',
        first_name: row.first_name || '',
        last_name: row.last_name || '',
        email: row.email || '',
        phone: row.phone || '',
        rut: row.rut || '',
        delivery_method: getDeliveryMethodText(row.delivery_method),
        received_store_code: row.received_store_code || '',
        address: row.address || '',
        comuna: row.comuna || '',
        region: row.region || '',
        status: getStatusText(row.status),
        product_count: row.product_count || 0,
        client_comment: row.client_comment || '',
        created_at: formatDate(row.created_at),
        updated_at: formatDate(row.updated_at),
      });
    });
  } else {
    // Products columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Estilo', key: 'product_style', width: 15 },
      { header: 'Talla', key: 'product_size', width: 10 },
      { header: 'SKU Confirmado', key: 'confirmed_sku', width: 20 },
      { header: 'Bodega Recepción', key: 'product_received_store_code', width: 18 },
      { header: 'N° Solicitud', key: 'request_number', width: 15 },
      { header: 'Cliente', key: 'customer_name', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Estado Producto', key: 'product_state', width: 15 },
      { header: 'Proceso', key: 'process', width: 15 },
      { header: 'Estado Operativo', key: 'product_status', width: 15 },
      { header: 'Crédito Estimado', key: 'credit_estimated', width: 15 },
      { header: 'Fecha Ingreso', key: 'created_at', width: 18 },
    ];

    // Add rows
    data.forEach(row => {
      worksheet.addRow({
        id: row.id || '',
        product_style: row.product_style || '',
        product_size: row.product_size || '',
        confirmed_sku: row.confirmed_sku || '',
        product_received_store_code: row.product_received_store_code || '',
        request_number: row.request_number || '',
        customer_name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
        email: row.email || '',
        product_state: row.confirmed_calculated_state || row.calculated_state || '',
        process: getProcessText(row.process),
        product_status: getStatusText(row.product_status),
        credit_estimated: row.credit_estimated || '',
        created_at: formatDate(row.created_at),
      });
    });
  }

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      type, 
      format, 
      requestNumber, 
      customer, 
      status, 
      deliveryMethod, 
      store, 
      dateFrom, 
      dateTo,
      productStyle,
      productState
    } = req.query;

    if (!type || (type !== 'requests' && type !== 'products')) {
      return res.status(400).json({ error: 'Invalid type parameter' });
    }

    if (!format || (format !== 'excel' && format !== 'csv')) {
      return res.status(400).json({ error: 'Invalid format parameter' });
    }

    // Parse filters
    const filters = {
      requestNumber: requestNumber as string,
      customer: customer as string,
      status: status ? (status as string).split(',').filter(Boolean) : undefined,
      deliveryMethod: deliveryMethod ? (deliveryMethod as string).split(',').filter(Boolean) : undefined,
      store: store as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      productStyle: productStyle as string,
      productState: productState as string,
    };

    // Fetch data
    const data = type === 'requests' 
      ? await fetchAllRequests(filters)
      : await fetchAllProducts(filters);

    // Generate file
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `trade-in-${type}-${timestamp}`;

    if (format === 'csv') {
      const csv = generateCSV(data, type as 'requests' | 'products');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      // Add BOM for Excel to recognize UTF-8
      return res.status(200).send('\uFEFF' + csv);
    } else {
      const excel = await generateExcel(data, type as 'requests' | 'products');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      return res.status(200).send(excel);
    }
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ error: 'Error generating export' });
  }
}
