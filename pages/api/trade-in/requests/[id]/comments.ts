import { NextApiRequest, NextApiResponse } from 'next';
import { getTradeInComments } from '@/app/lib/trade-in/sql-data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get comments for the trade-in request
    const comments = await getTradeInComments(parseInt(id as string));

    res.status(200).json({ 
      success: true, 
      comments: comments 
    });

  } catch (error) {
    console.error('Error fetching trade-in comments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener los comentarios', 
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}
