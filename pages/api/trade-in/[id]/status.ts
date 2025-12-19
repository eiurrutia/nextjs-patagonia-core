import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    console.log('No autorizado. Debes iniciar sesión.');
    return res.status(401).json({ message: 'No autorizado. Debes iniciar sesión.' });
  }
  
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const result = await sql`
        SELECT status FROM trade_in_requests WHERE id = ${id as string}
      `;
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Trade-In not found' });
      }
      
      res.status(200).json({ status: result.rows[0].status });
    } catch (error) {
      console.error('Error fetching status:', error);
      res.status(500).json({ message: 'Error fetching status' });
    }
  } else if (req.method === 'PUT' || req.method === 'PATCH') {
    const { status } = req.body;
    
    // Validar que el estado sea válido
    const validStatuses = [
      'solicitud_recibida',
      'entregado_cliente',
      'recepcionado_tienda',
      'factura_enviada',
      'credito_entregado'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    try {
      await sql`
        UPDATE trade_in_requests 
        SET status = ${status}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id as string}
      `;
      
      res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json({ message: 'Error updating status' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'PATCH']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
