import { executeQuery } from '@/app/lib/snowflakeClient';
import { TradeInRecord } from '@/app/lib/definitions';

const BLUELINE_URL = process.env.BLUELINE_URL;
const BLUELINE_EMISOR_RUT = process.env.BLUELINE_EMISOR_RUT;


/**
 * Inserts a Trade-In record into the Snowflake database
 * @param record - An object containing Trade-In data
 * @returns A promise that resolves to the result of the query execution
 */
export async function insertTradeInRecord(record: any): Promise<any> {
  const {
    firstName,
    lastName,
    rut,
    email,
    phone,
    selectedItemColor,
    address,
    houseDetails,
    client_comment,
  } = record;

  // SQL query to insert a new Trade-In record
  const sqlText = `
    INSERT INTO PATAGONIA.CORE_TEST.TRADE_IN_RECORDS (
        ID,
        FIRST_NAME,
        LAST_NAME,
        RUT,
        EMAIL,
        PHONE,
        SELECTED_ITEM_COLOR,
        ADDRESS,
        HOUSE_DETAILS,
        CLIENT_COMMENT,
        SNOWFLAKE_CREATED_AT,
        SNOWFLAKE_UPDATED_AT
    )
    VALUES (
            (SELECT MAX(ID) + 1 FROM PATAGONIA.CORE_TEST.TRADE_IN_RECORDS),
            ?, ?, ?, ?, ?, ?, ?, ?, ?,
            CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())
  `;

  // Parameters to bind to the SQL query
  const binds = [
    firstName,
    lastName,
    rut,
    email,
    phone,
    selectedItemColor,
    address,
    houseDetails || null,
    client_comment || null
  ];

  try {
    // Execute the query and return the result
    const result = await executeQuery(sqlText, binds);
    return result;
  } catch (error) {
    console.error('Error inserting Trade-In record into Snowflake:', error);
    throw error; // Rethrow the error to be handled by the caller
  }
}


export async function fetchTradeInRecords(query: string, currentPage: number): Promise<TradeInRecord[]> {
    const pageSize = 20; // Número de registros por página
    const offset = (currentPage - 1) * pageSize;
  
    const sqlText = `
      SELECT *
      FROM PATAGONIA.CORE_TEST.TRADE_IN_RECORDS
      WHERE LOWER(FIRST_NAME) LIKE ? OR LOWER(LAST_NAME) LIKE ? OR LOWER(EMAIL) LIKE ? OR LOWER(RUT) LIKE ? OR LOWER(PHONE) LIKE ?
      ORDER BY SNOWFLAKE_CREATED_AT DESC
      LIMIT ?
      OFFSET ?
    `;
  
    const searchQuery = `%${query.toLowerCase()}%`;
  
    const binds = [searchQuery, searchQuery, searchQuery, searchQuery, searchQuery, pageSize, offset];
  
    try {
      const result = await executeQuery<TradeInRecord>(sqlText, binds);
      return result;
    } catch (error) {
      console.error('Error fetching Trade-In records:', error);
      throw error;
    }
  }

/**
 * Fetches a Trade-In record from the Snowflake database by RUT
 * @param rut - The RUT of the client to search for
 * @returns A promise that resolves to the Trade-In record, or null if not found
 * @throws An error if the query execution fails
 * @example
 * const record = await fetchTradeInRecordByRut('12345678-9');
 **/
export async function fetchTradeInRecordById(id: string): Promise<TradeInRecord | null> {
  const sqlText = `
    SELECT *
    FROM PATAGONIA.CORE_TEST.TRADE_IN_RECORDS
    WHERE ID = ?
  `;

  const binds = [id];

  try {
    const result = await executeQuery<TradeInRecord>(sqlText, binds);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Error fetching Trade-In record by RUT:', error);
    throw error;
  }
}

/**
 * Updates the status of a Trade-In record in the Snowflake database
 * @param id - The ID of the Trade-In record to update
 * @param status - The new status to set
 * @returns A promise that resolves when the query execution is successful
 * @throws An error if the query execution fails
 * @example
 * await updateTradeInStatus('12345678-9', 'APPROVED');
 * console.log('Trade-In status updated successfully'); 
 */
export async function updateTradeInStatus(id: string, status: string) {
  const query = `
    UPDATE PATAGONIA.CORE_TEST.TRADE_IN_RECORDS
    SET STATUS = ?
    WHERE ID = ?
  `;
  const params = [
    status,
    id,
  ];

  // Ejecuta la consulta en Snowflake o la base de datos que uses
  await executeQuery(query, params);
}

/**
 * Updates a Trade-In record in the Snowflake database
 * @param id - The ID of the Trade-In record to update
 * @param updates - An object containing the fields to update
 * @returns A promise that resolves when the query execution is successful
 * @throws An error if the query execution fails
 * @example
 * await updateTradeInRecord('204', { status: 'APPROVED', client_comment: 'Great customer!' });
 * console.log('Trade-In record updated successfully');
 */
export async function updateTradeInRecord(id: string, updates: Record<string, any>) {
  const fields = Object.keys(updates).map(field => `${field} = ?`).join(', ');
  const values = [...Object.values(updates), id];

  const query = `
    UPDATE PATAGONIA.CORE_TEST.TRADE_IN_RECORDS
    SET ${fields}
    WHERE ID = ?
  `;

  await executeQuery(query, values);
}


/**
 * Gets the next available folio number for a given DTE type
 * @returns A promise that resolves to the next available folio number
 * @throws An error if the request fails or the folio is not found in the response
 * @example
 * const folio = await getFolio();
 * console.log('Next available folio:', folio);
 */
export async function getFolio(): Promise<string> {
  const xmlRequest = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
      <soapenv:Header/>
      <soapenv:Body>
        <blu:getFolio xmlns:blu="http://blueline">
          <blu:rut>${BLUELINE_EMISOR_RUT}</blu:rut>
          <blu:dv>0</blu:dv>
          <blu:tipoDTE>46</blu:tipoDTE>
          <blu:local>1</blu:local>
          <blu:pos>1</blu:pos>
        </blu:getFolio>
      </soapenv:Body>
    </soapenv:Envelope>`;

  try {
    const response = await fetch(`${BLUELINE_URL}/ControlFoliosBl/services/AsignaFolios?wsdl`, {
      method: 'POST',
      headers: {
        'SOAPAction': `${BLUELINE_URL}/ControlFoliosBl/services/AsignaFolios?wsdl`,
        'Content-Type': 'text/xml',
      },
      body: xmlRequest,
    });

    const textResponse = await response.text();

    // Extract the escaped content from the response
    const escapedContentMatch = textResponse.match(/<ns1:getFolioReturn[^>]*>(.*?)<\/ns1:getFolioReturn>/);
    if (!escapedContentMatch) {
      throw new Error('No se encontró el contenido escapado');
    }

    const escapedContent = escapedContentMatch[1];
    const unescapedContent = escapedContent.replace(/&lt;/g, '<').replace(/&gt;/g, '>');

    // Regex to extract the folio number from the unescaped content
    const folioMatch = unescapedContent.match(/<Folio>(\d+)<\/Folio>/);
    
    if (folioMatch) {
      console.log('Folio:', folioMatch[1]);
      return folioMatch[1];
    } else {
      throw new Error('No se encontró el folio en la respuesta');
    }
  } catch (error) {
    console.error('Error fetching folio:', error);
    throw error;
  }
}



/**
 * Generates an invoice for a given Trade-In ID and folio number
 * @param tradeInId - The ID of the Trade-In record
 * @param folio - The folio number to use in the invoice
 * @returns A promise that resolves to the URL of the generated PDF invoice
 * @throws An error if the request fails or the PDF URL is not found in the response
 * @example
 * const pdfUrl = await generateInvoice('212', '12345');
 * console.log('Invoice PDF URL:', pdfUrl);
 */
export async function generateInvoice(tradeInId: string, folio: string): Promise<string> {
  const xmlRequest = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
    <soapenv:Header/>
    <soapenv:Body>
    <blu:firmaDTE xmlns:blu="http://blueline">
    <blu:RUTEmisor>${BLUELINE_EMISOR_RUT}</blu:RUTEmisor>
    <blu:DVEmisor>0</blu:DVEmisor>
    <blu:tipoArchivo>XML</blu:tipoArchivo>
    <blu:formatoPDF>2</blu:formatoPDF>
    <blu:archivo><![CDATA[<?xml version="1.0" encoding="ISO-8859-1" standalone="yes"?><DTE>
    <Documento><Encabezado><IdDoc><TipoDTE>46</TipoDTE><Folio>${folio}</Folio><FchEmis>2024-09-25</FchEmis>
    <IndServicio>3</IndServicio><FchVenc>2024-09-25</FchVenc></IdDoc><Emisor><RUTEmisor>76018478-0</RUTEmisor>
    <RznSoc>Patagonia Chile Limitada</RznSoc><GiroEmis>VENTA AL POR MAYOR DE OTROS PRODUCTOS N.</GiroEmis>
    <Acteco>519000</Acteco><DirOrigen>Don Carlos 2945</DirOrigen><CmnaOrigen>Las Condes</CmnaOrigen>
    <CiudadOrigen>Santiago</CiudadOrigen></Emisor><Receptor><RUTRecep>18855833-k</RUTRecep>
    <RznSocRecep>Enrique Urrutia</RznSocRecep><CorreoRecep>ejemplo@hotmail.com</CorreoRecep>
    <DirRecep>dieciocho 747 depto 811</DirRecep><CmnaRecep>Santiago</CmnaRecep>
    <CiudadRecep>Santiago</CiudadRecep><Contacto>190444</Contacto></Receptor>
    <Totales><MntNeto>65546</MntNeto><TasaIVA>19</TasaIVA><IVA>12454</IVA><MntTotal>78000</MntTotal>
    </Totales></Encabezado><Detalle><NroLinDet>1</NroLinDet><CdgItem><TpoCodigo>INT1</TpoCodigo>
    <VlrCodigo>60155-SGRY-2T</VlrCodigo></CdgItem><NmbItem>BABY MICRO D SNAP-T JKT</NmbItem>
    <QtyItem>1.00</QtyItem><UnmdItem>un</UnmdItem><PrcItem>49000</PrcItem><MontoItem>49000</MontoItem>
    </Detalle><TmstFirma>2024-09-25T20:10:26</TmstFirma></Documento><Personalizados><contactos></contactos>
    <impresora /></Personalizados></DTE>]]></blu:archivo>
    </blu:firmaDTE></soapenv:Body></soapenv:Envelope>`;

  try {
    const response = await fetch(`${BLUELINE_URL}/FirmaDTEBl/services/firmaDTEBl?wsdl`, {
      method: 'POST',
      headers: {
        'SOAPAction': `${BLUELINE_URL}/FirmaDTEBl/services/firmaDTEBl?wsdl`,
        'Content-Type': 'text/xml',
      },
      body: xmlRequest,
    });

    const textResponse = await response.text();

    // Extract the escaped content from the response
    const escapedContentMatch = textResponse.match(/<firmaDTEReturn[^>]*>(.*?)<\/firmaDTEReturn>/);
    if (!escapedContentMatch) {
      throw new Error('No se encontró el contenido escapado');
    }

    const escapedContent = escapedContentMatch[1];
    const unescapedContent = escapedContent.replace(/&lt;/g, '<').replace(/&gt;/g, '>');

    // Regex to extract the URL of the PDF from the unescaped content
    const urlMatch = unescapedContent.match(/<URLpdf>(.*?)<\/URLpdf>/);

    if (urlMatch) {
      return urlMatch[1];
    } else {
      throw new Error('No se encontró la URL del PDF en la respuesta');
    }
  } catch (error) {
    console.error('Error generating invoice:', error);
    throw error;
  }
}

